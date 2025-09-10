"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { dataStore, type SyncStatus } from "@/lib/data-store"
import type { Partner, Review, FairnessMetric } from "@/lib/interfaces"

export const useDataStore = () => {
  const [partners, _setPartners] = useState<Partner[]>([])
  const [reviews, _setReviews] = useState<Review[]>([])
  const [fairnessMetrics, _setFairnessMetrics] = useState<FairnessMetric[]>([])
  const [syncStatus, _setSyncStatus] = useState<SyncStatus>({ status: "idle", lastSync: null, pendingChanges: 0 })

  const dataStoreRef = useRef<typeof dataStore.instance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      dataStoreRef.current = dataStore.instance;
      const currentDataStore = dataStoreRef.current;

      // Initialize data store (loads from local storage or starts empty)
      currentDataStore.initializeWithMockData();

      // Initial data load
      _setPartners(currentDataStore.getPartners());
      _setReviews(currentDataStore.getReviews());
      _setFairnessMetrics(currentDataStore.getFairnessMetrics());
      _setSyncStatus(currentDataStore.getSyncStatus());

      // Subscribe to data changes
      const unsubscribeData = currentDataStore.subscribe(() => {
        _setPartners(currentDataStore.getPartners());
        _setReviews(currentDataStore.getReviews());
        _setFairnessMetrics(currentDataStore.getFairnessMetrics());
      });

      const unsubscribeSync = currentDataStore.subscribeSyncStatus(_setSyncStatus);

      return () => {
        unsubscribeData();
        unsubscribeSync();
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Memoize the functions to prevent unnecessary re-renders of components using this hook
  const addPartner = useCallback((partner: Partner) => {
    dataStoreRef.current?.addPartner(partner);
  }, []);

  const updatePartner = useCallback((id: string, updates: Partial<Partner>) => {
    dataStoreRef.current?.updatePartner(id, updates);
  }, []);

  const deletePartner = useCallback((id: string) => {
    dataStoreRef.current?.deletePartner(id);
  }, []);

  const setPartners = useCallback((newPartners: Partner[]) => {
    dataStoreRef.current?.setPartners(newPartners);
  }, []);

  const forceSync = useCallback(() => {
    dataStoreRef.current?.forceSync();
  }, []);

  // Expose an async clearAllData that can optionally clear server-side data when called with true
  const clearAllData = useCallback(async (syncServer: boolean = false) => {
    try {
      await dataStoreRef.current?.clearAllData(syncServer);
    } catch (err) {
      // swallow here; callers can catch if desired
      console.error('clearAllData failed', err);
      throw err;
    }
  }, []);

  const getChangeHistory = useCallback(() => {
    return dataStoreRef.current?.getChangeHistory() || [];
  }, []);

  return {
    partners,
    reviews,
    fairnessMetrics,
    syncStatus,
    addPartner,
    updatePartner,
    deletePartner,
    setPartners,
    forceSync,
    clearAllData,
    getChangeHistory,
  };
};