import type { Partner, Review, FairnessMetric } from "./mock-data"

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
  private reviews: Review[] = []
  private fairnessMetrics: FairnessMetric[] = []
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
        localStorage.setItem("nova-reviews", JSON.stringify(this.reviews))
        localStorage.setItem("nova-fairness", JSON.stringify(this.fairnessMetrics))
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
        const partners = localStorage.getItem("nova-partners")
        const reviews = localStorage.getItem("nova-reviews")
        const fairness = localStorage.getItem("nova-fairness")
        const syncData = localStorage.getItem("nova-sync-status")

        if (partners) this.partners = JSON.parse(partners)
        if (reviews) this.reviews = JSON.parse(reviews)
        if (fairness) this.fairnessMetrics = JSON.parse(fairness)

        if (syncData) {
          const parsed = JSON.parse(syncData)
          this.updateSyncStatus({
            lastSync: new Date(parsed.lastSync),
            pendingChanges: 0,
          })
          this.changeHistory = parsed.changeHistory || []
        }

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

  setPartners(partners: Partner[]) {
    this.partners = partners
    this.recordChange({
      type: "bulk_import",
      timestamp: new Date(),
      data: { count: partners.length },
    })
    this.notify()
  }

  getPartners(): Partner[] {
    return this.partners
  }

  addPartner(partner: Partner) {
    this.partners.push(partner)
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
      this.partners[index] = { ...this.partners[index], ...updates }
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
    this.recordChange({
      type: "partner_deleted",
      timestamp: new Date(),
      data: { id, name: partner?.name },
    })
    this.notify()
  }

  setReviews(reviews: Review[]) {
    this.reviews = reviews
    this.notify()
  }

  getReviews(): Review[] {
    return this.reviews
  }

  setFairnessMetrics(metrics: FairnessMetric[]) {
    this.fairnessMetrics = metrics
    this.notify()
  }

  getFairnessMetrics(): FairnessMetric[] {
    return this.fairnessMetrics
  }

  initializeWithMockData(partners: Partner[], reviews: Review[], fairnessMetrics: FairnessMetric[]) {
    this.partners = partners
    this.reviews = reviews
    this.fairnessMetrics = fairnessMetrics
    this.notify()
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
        setReviews: () => {},
        setFairnessMetrics: () => {},
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