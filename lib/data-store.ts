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
    if (!this.isOnline || this.syncStatus.pendingChanges === 0) {
      return
    }

    this.updateSyncStatus({ status: "syncing" })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      this.saveToLocalStorage()

      this.updateSyncStatus({
        status: "idle",
        lastSync: new Date(),
        pendingChanges: 0,
        error: undefined,
      })
    } catch (error) {
      this.updateSyncStatus({
        status: "error",
        error: error instanceof Error ? error.message : "Sync failed",
      })
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
        const groupValue = partner[category];
        if (groupValue) {
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
          group: groupName,
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
        // Optionally, you could load a minimal default set here if no local storage data
        // For now, we'll rely on the user to import via DataManagementPage
        console.log("No data found in local storage. Please import data via Data Management.");
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
      } as DataStore) // Cast to DataStore to satisfy type checker
    : clientDataStoreInstance,
};

// Keep getDataStoreInstance for backward compatibility if other files still use it,
// but it will now return the singleton instance.
export function getDataStoreInstance(): DataStore {
  return dataStore.instance;
}