"use client"

import { useState, useEffect } from "react"
import { dataStore, type SyncStatus } from "@/lib/data-store"
import type { Partner, Review, FairnessMetric } from "@/lib/mock-data"

export const useDataStore = () => {
  const [partners, setPartners] = useState<Partner[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetric[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(dataStore.getSyncStatus())

  useEffect(() => {
    dataStore.loadFromLocalStorage()

    // Initial data load
    setPartners(dataStore.getPartners())
    setReviews(dataStore.getReviews())
    setFairnessMetrics(dataStore.getFairnessMetrics())

    // Subscribe to data changes
    const unsubscribeData = dataStore.subscribe(() => {
      setPartners(dataStore.getPartners())
      setReviews(dataStore.getReviews())
      setFairnessMetrics(dataStore.getFairnessMetrics())
    })

    const unsubscribeSync = dataStore.subscribeSyncStatus(setSyncStatus)

    return () => {
      unsubscribeData()
      unsubscribeSync()
    }
  }, [])

  return {
    partners,
    reviews,
    fairnessMetrics,
    syncStatus,
    addPartner: dataStore.addPartner.bind(dataStore),
    updatePartner: dataStore.updatePartner.bind(dataStore),
    deletePartner: dataStore.deletePartner.bind(dataStore),
    setPartners: dataStore.setPartners.bind(dataStore),
    setReviews: dataStore.setReviews.bind(dataStore),
    setFairnessMetrics: dataStore.setFairnessMetrics.bind(dataStore),
    forceSync: dataStore.forceSync.bind(dataStore),
    clearAllData: dataStore.clearAllData.bind(dataStore),
    getChangeHistory: dataStore.getChangeHistory.bind(dataStore),
  }
}
