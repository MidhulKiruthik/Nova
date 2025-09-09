import type { Partner, Review, FairnessMetric } from "./interfaces"
import { calculateNovaScore, analyzeReviewSentiment, mapScoreToCategoricalSentiment } from "./nova-score-model"

export interface SyncStatus {
  status: "idle" | "syncing" | "error" | "offline"
  lastSync: Date | null
  pendingChanges: number
  error?: string
}

export interface DataChangeEvent {
  type: "partner_added" | "partner_updated" | "partner_deleted" | "bulk_import"
  timestamp: Date
  data: any
  userId?: string
}

/**
 * Normalizes a raw age group string into one of the predefined categories for fairness analysis.
 * Returns the normalized category string or null if it doesn't fit.
 */
export const normalizeAgeGroup = (rawAgeGroup: string): string | null => {
  const lowerCaseGroup = rawAgeGroup.toLowerCase().replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric except hyphen

  if (
    lowerCaseGroup.match(/^(1[8-9]|2[0-9]|30)-?/) || // Matches 18-30, 18-24, 25-30, or single ages like 19, 25
    lowerCaseGroup.includes('youngadult') ||
    lowerCaseGroup.includes('youth')
  ) {
    return "18-30";
  }
  if (
    lowerCaseGroup.match(/^(3[1-9]|4[0-5])-?/) || // Matches 31-45, 30-40, or single ages like 35, 40
    lowerCaseGroup.includes('middleage') ||
    lowerCaseGroup.includes('adult')
  ) {
    return "31-45";
  }
  if (
    lowerCaseGroup.match(/^(4[6-9]|[5-6][0-9]|70)-?/) || // Matches 46-70, 45-60, 60+, or single ages like 50, 65, 70
    lowerCaseGroup.includes('senior') ||
    lowerCaseGroup.includes('elderly') ||
    lowerCaseGroup.includes('olderadult')
  ) {
    return "46-70";
  }
  return null;
};

class DataStore {
  private partners: Partner[] = []
  private reviews: Review[] = [] // Dynamically generated from partner.rawReviewsText
  private fairnessMetrics: FairnessMetric[] = [] // Dynamically generated from partner demographic data
  private listeners: (() => void)[] = []
  private syncListeners: ((status: SyncStatus) => void)[] = []
  private changeHistory: DataChangeEvent[] = []
  private syncStatus: SyncStatus = {
    status: "idle",
    lastSync: null,
    pendingChanges: 0,
  }
  private autoSaveTimer: NodeJS.Timeout | null = null
  private isOnline = true

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine
      window.addEventListener("online", () => {
        this.isOnline = true
        this.updateSyncStatus({ status: "idle" })
        this.performSync()
      })
      window.addEventListener("offline", () => {
        this.isOnline = false
        this.updateSyncStatus({ status: "offline" })
      })
    }
  }

  subscribe(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  subscribeSyncStatus(callback: (status: SyncStatus) => void) {
    this.syncListeners.push(callback)
    return () => {
      this.syncListeners = this.syncListeners.filter((listener) => listener !== callback)
    }
  }

  private updateSyncStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates }
    this.syncListeners.forEach((callback) => callback(this.syncStatus))
  }

  private recordChange(event: DataChangeEvent) {
    this.changeHistory.push(event)
    this.updateSyncStatus({
      pendingChanges: this.syncStatus.pendingChanges + 1,
    })
    this.scheduleAutoSave()
  }

  private scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    this.autoSaveTimer = setTimeout(() => {
      this.performSync()
    }, 2000)
  }

  private async performSync() {
    if (!this.isOnline) {
      this.updateSyncStatus({ status: "offline" })
      return
    }

    this.updateSyncStatus({ status: "syncing" })

    const apiBase = ((): string => {
      if (typeof window === 'undefined') return (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:5000'
      try {
        // Next.js exposes env on __NEXT_DATA__ during SSR; prefer explicit fallback
        const nd = (window as any).__NEXT_DATA__
        if (nd && nd.env && nd.env.NEXT_PUBLIC_API_URL) return nd.env.NEXT_PUBLIC_API_URL
      } catch (_) {}
      return (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:5000'
    })()

    try {
      // If we have pending changes, push them to server
      if (this.changeHistory.length > 0) {
        const resp = await fetch(`${apiBase}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partners: this.partners, changeHistory: this.changeHistory }),
        })

        if (!resp.ok) {
          throw new Error(`Server sync failed: ${resp.status}`)
        }

        // We intentionally don't replace local data here yet; we'll fetch canonical copy next
      }

      // Fetch canonical partners from server to ensure we are up-to-date
      const getResp = await fetch(`${apiBase}/partners`, { method: 'GET' })
      if (getResp.ok) {
        const data = await getResp.json()
        if (Array.isArray(data.partners)) {
          this._processPartnersAndDeriveMetrics(data.partners)
          this.saveToLocalStorage()
        }
      } else {
        // If GET failed, still persist locally and report error
        console.warn('Failed to fetch partners after sync:', getResp.status)
      }

      // Clear local change history on success
      this.changeHistory = []

      this.updateSyncStatus({
        status: 'idle',
        lastSync: new Date(),
        pendingChanges: 0,
        error: undefined,
      })
    } catch (error) {
      console.error('performSync error:', error)
      this.updateSyncStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      })
      // Ensure we still save locally so user data isn't lost
      try { this.saveToLocalStorage() } catch (_) {}
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nova-partners", JSON.stringify(this.partners))
        localStorage.setItem("nova-reviews", JSON.stringify(this.reviews)) // Save generated reviews
        localStorage.setItem("nova-fairness", JSON.stringify(this.fairnessMetrics)) // Save generated fairness metrics
        localStorage.setItem(
          "nova-sync-status",
          JSON.stringify({
            lastSync: new Date().toISOString(),
            changeHistory: this.changeHistory.slice(-50),
          }),
        )
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
      }
    }
  }

  loadFromLocalStorage() {
    if (typeof window !== "undefined") {
      try {
        const partnersData = localStorage.getItem("nova-partners")
        const reviewsData = localStorage.getItem("nova-reviews")
        const fairnessData = localStorage.getItem("nova-fairness")
        const syncData = localStorage.getItem("nova-sync-status")

        if (partnersData) this.partners = JSON.parse(partnersData)
        if (reviewsData) this.reviews = JSON.parse(reviewsData)
        if (fairnessData) this.fairnessMetrics = JSON.parse(fairnessData)

        if (syncData) {
          const parsed = JSON.parse(syncData)
          this.updateSyncStatus({
            lastSync: new Date(parsed.lastSync),
            pendingChanges: 0,
          })
          this.changeHistory = parsed.changeHistory || []
        }

        // After loading raw data, re-process to ensure consistency
        this._processPartnersAndDeriveMetrics(this.partners);
        this.notify()
      } catch (error) {
        console.error("Failed to load from localStorage:", error)
      }
    }
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus
  }

  async forceSync() {
    await this.performSync()
  }

  private notify() {
    this.listeners.forEach((callback) => callback())
  }

  // --- Internal methods to derive reviews and fairness metrics ---
  private _generateReviewsFromPartners(partners: Partner[]): Review[] {
    const generatedReviews: Review[] = [];
  partners.forEach(partner => {
  if (partner.rawReviewsText) {
        const comments = partner.rawReviewsText.split(';').map(s => s.trim()).filter(Boolean);
        comments.forEach((comment, index) => {
          // Prioritize overallSentimentScore from Excel if available, otherwise analyze comment
          const sentimentScore = partner.overallSentimentScore !== undefined
            ? partner.overallSentimentScore
            : analyzeReviewSentiment(comment);
          
          generatedReviews.push({
            id: `${partner.id}-r${index + 1}`,
            partnerId: partner.id,
            rating: partner.avgRating, // Use partner's avgRating as a proxy
            comment: comment,
            sentimentScore: sentimentScore,
            sentiment: mapScoreToCategoricalSentiment(sentimentScore), // Populate categorical sentiment
            date: new Date().toISOString().split('T')[0], // Current date or derive from partner joinDate
            tripId: `${partner.id}-t${index + 1}`,
          });
        });
      }
    });
    return generatedReviews;
  }

  private _calculateFairnessMetrics(partners: Partner[]): FairnessMetric[] {
    if (partners.length === 0) return [];

    const fairnessMetrics: FairnessMetric[] = [];
  const demographicCategories = ["ageGroup", "areaType", "gender", "ethnicity"] as const;

    const overallAvgNovaScore = partners.reduce((sum, p) => sum + p.novaScore, 0) / partners.length;

    demographicCategories.forEach(category => {
      const groups = new Map<string, { totalScore: number; count: number }>();

      partners.forEach(partner => {
        // partner[category] can be string; normalizeAgeGroup returns string|null so allow that union
        let groupValue: string | null = (partner as any)[category] || null;
        if (category === "ageGroup" && groupValue) {
          groupValue = normalizeAgeGroup(groupValue); // Normalize age group here (may return null)
        }

        if (groupValue) { // Only proceed if groupValue is a non-empty string
          if (!groups.has(groupValue)) {
            groups.set(groupValue, { totalScore: 0, count: 0 });
          }
          const groupData = groups.get(groupValue)!;
          groupData.totalScore += partner.novaScore;
          groupData.count += 1;
        }
      });

      groups.forEach((data, groupName) => {
        const averageScore = data.count > 0 ? data.totalScore / data.count : 0;
        const bias = overallAvgNovaScore > 0 ? (averageScore - overallAvgNovaScore) / overallAvgNovaScore : 0;

        fairnessMetrics.push({
          demographic: `${category}: ${groupName}`,
          category: category === "ageGroup" ? "age" : category === "areaType" ? "area" : category as any,
          group: groupName, // This `groupName` is what needs to match "18-30", etc.
          averageScore: Math.round(averageScore),
          count: data.count,
          bias: parseFloat(bias.toFixed(3)),
        });
      });
    });

    return fairnessMetrics;
  }

  private _processPartnersAndDeriveMetrics(rawPartners: Partner[]) {
    // 1. Assign partners directly, Nova Score and overallSentimentScore are now taken from the input data
    this.partners = rawPartners;

    // 2. Generate Reviews (which will now use overallSentimentScore if available)
    this.reviews = this._generateReviewsFromPartners(this.partners);

    // 3. Calculate Fairness Metrics based on the partners (with their assigned Nova Scores)
    this.fairnessMetrics = this._calculateFairnessMetrics(this.partners);
  }

  // --- Public API methods ---

  setPartners(partners: Partner[]) {
    this._processPartnersAndDeriveMetrics(partners);
    this.recordChange({
      type: "bulk_import",
      timestamp: new Date(),
      data: { count: partners.length },
    });
    this.notify();
  }

  getPartners(): Partner[] {
    return this.partners
  }

  addPartner(partner: Partner) {
    this.partners.push(partner)
    // Re-process all data to update reviews and fairness metrics
    this._processPartnersAndDeriveMetrics(this.partners);
    this.recordChange({
      type: "partner_added",
      timestamp: new Date(),
      data: { id: partner.id, name: partner.name },
    })
    this.notify()
  }

  updatePartner(id: string, updates: Partial<Partner>) {
    const index = this.partners.findIndex((p) => p.id === id)
    if (index !== -1) {
      const oldPartner = this.partners[index]
      const updatedPartner = { ...this.partners[index], ...updates }
      
      this.partners[index] = updatedPartner
      // Re-process all data to update reviews and fairness metrics
      this._processPartnersAndDeriveMetrics(this.partners);
      this.recordChange({
        type: "partner_updated",
        timestamp: new Date(),
        data: { id, updates, previousName: oldPartner.name },
      })
      this.notify()
    }
  }

  deletePartner(id: string) {
    const partner = this.partners.find((p) => p.id === id)
    this.partners = this.partners.filter((p) => p.id !== id)
    // Re-process all data to update reviews and fairness metrics
    this._processPartnersAndDeriveMetrics(this.partners);
    this.recordChange({
      type: "partner_deleted",
      timestamp: new Date(),
      data: { id, name: partner?.name },
    })
    this.notify()
  }

  getReviews(): Review[] {
    return this.reviews
  }

  getFairnessMetrics(): FairnessMetric[] {
    return this.fairnessMetrics
  }

  // This method now just ensures data is processed if it exists, or starts empty
  initializeWithMockData() {
    // On client-side, this will trigger loadFromLocalStorage
    // On server-side, it will do nothing as dataStore.instance is a dummy
    if (typeof window !== "undefined") {
      this.loadFromLocalStorage();
      if (this.partners.length === 0) {
        // No local data — try to fetch canonical partners from backend (/partners)
        ;(async () => {
          try {
            const apiBase = ((): string => {
              if (typeof window === 'undefined') return 'http://localhost:5000'
              try {
                const nd = (window as any).__NEXT_DATA__
                if (nd && nd.env && nd.env.NEXT_PUBLIC_API_URL) return nd.env.NEXT_PUBLIC_API_URL
              } catch (_) {}
              return 'http://localhost:5000'
            })()

            const resp = await fetch(`${apiBase}/partners`)
            if (resp.ok) {
              const data = await resp.json()
              if (Array.isArray(data.partners)) {
                this._processPartnersAndDeriveMetrics(data.partners)
                this.saveToLocalStorage()
                console.log(`Loaded ${data.partners.length} partners from server`)
              }
            }
          } catch (err) {
            console.warn('Failed to load partners from server:', err)
          } finally {
            this.notify()
          }
        })()
      }
    }
    this.notify();
  }

  getChangeHistory(): DataChangeEvent[] {
    return this.changeHistory
  }

  clearAllData() {
    this.partners = []
    this.reviews = []
    this.fairnessMetrics = []
    this.changeHistory = []
    this.updateSyncStatus({ pendingChanges: 0 })

    if (typeof window !== "undefined") {
      localStorage.removeItem("nova-partners")
      localStorage.removeItem("nova-reviews")
      localStorage.removeItem("nova-fairness")
      localStorage.removeItem("nova-sync-status")
    }

    this.notify()
  }

  // Expose normalizeAgeGroup for external use
  _normalizeAgeGroup = normalizeAgeGroup;
}

// Create a single instance of DataStore for the client
const clientDataStoreInstance = new DataStore();

// Export a singleton object that handles server-side dummy data and client-side real data
export const dataStore = {
  instance: typeof window === "undefined"
    ? ({
        getPartners: () => [],
        getReviews: () => [],
        getFairnessMetrics: () => [],
        getSyncStatus: () => ({ status: 'offline', lastSync: null, pendingChanges: 0 }),
        addPartner: () => {},
        updatePartner: () => {},
        deletePartner: () => {},
        setPartners: () => {},
        setReviews: () => {}, // No longer directly sets reviews
        setFairnessMetrics: () => {}, // No longer directly sets fairness metrics
        forceSync: async () => {},
        clearAllData: () => {},
        getChangeHistory: () => [],
        initializeWithMockData: () => {},
        loadFromLocalStorage: () => {},
        subscribe: () => () => {},
        subscribeSyncStatus: () => () => {},
        _normalizeAgeGroup: () => null, // Dummy implementation for server-side
  } as unknown as DataStore) // Cast to DataStore via unknown to satisfy type checker
  : clientDataStoreInstance,
};

// Keep getDataStoreInstance for backward compatibility if other files still use it,
// but it will now return the singleton instance.
export function getDataStoreInstance(): DataStore {
  return dataStore.instance;
}