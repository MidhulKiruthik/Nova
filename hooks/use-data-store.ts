"use client"

import { useState, useEffect, useRef } from "react"
import { dataStore, type SyncStatus } from "@/lib/data-store"
import type { Partner, Review, FairnessMetric } from "@/lib/interfaces"

export const useDataStore = () => {
  // Initialize with empty/default values for SSR consistency
  const [partners, setPartners] = useState<Partner[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetric[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: "idle", lastSync: null, pendingChanges: 0 })

  // Use useRef to hold the DataStore instance, ensuring it's only created once on the client
  const dataStoreRef = useRef<typeof dataStore.instance | null>(null);

  useEffect(() => {
    // Ensure this code only runs on the client
    if (typeof window !== "undefined") {
      dataStoreRef.current = dataStore.instance;
      const currentDataStore = dataStoreRef.current;

      // Initialize with mock data (which now just loads from local storage or starts empty)
      currentDataStore.initializeWithMockData();

      // Initial data load
      setPartners(currentDataStore.getPartners());
      setReviews(currentDataStore.getReviews());
      setFairnessMetrics(currentDataStore.getFairnessMetrics());
      setSyncStatus(currentDataStore.getSyncStatus());

      // Subscribe to data changes
      const unsubscribeData = currentDataStore.subscribe(() => {
        setPartners(currentDataStore.getPartners());
        setReviews(currentDataStore.getReviews());
        setFairnessMetrics(currentDataStore.getFairnessMetrics());
      });

      const unsubscribeSync = currentDataStore.subscribeSyncStatus(setSyncStatus);

      return () => {
        unsubscribeData();
        unsubscribeSync();
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Provide functions that safely access the dataStoreRef.current
  // These functions will only work after the useEffect has run on the client.
  // For SSR, they will effectively be no-ops or return default values if called before hydration.
  const safeDataStoreCall = <T extends keyof DataStore>(method: T, ...args: Parameters<DataStore[T]>): ReturnType<DataStore[T]> | undefined => {
    if (dataStoreRef.current) {
      // @ts-ignore - TypeScript struggles with spread args and method types here
      return dataStoreRef.current[method](...args);
    }
    // Provide a fallback for methods that return data
    if (method === 'getPartners' || method === 'getReviews' || method === 'getFairnessMetrics' || method === 'getChangeHistory') {
      return [] as ReturnType<DataStore[T]>;
    }
    if (method === 'getSyncStatus') {
      return { status: 'offline', lastSync: null, pendingChanges: 0 } as ReturnType<DataStore[T]>;
    }
    return undefined;
  };


  return {
    partners,
    reviews,
    fairnessMetrics,
    syncStatus,
    addPartner: (partner: Partner) => safeDataStoreCall('addPartner', partner),
    updatePartner: (id: string, updates: Partial<Partner>) => safeDataStoreCall('updatePartner', id, updates),
    deletePartner: (id: string) => safeDataStoreCall('deletePartner', id),
    setPartners: (partners: Partner[]) => safeDataStoreCall('setPartners', partners),
    // setReviews and setFairnessMetrics are now internal to DataStore
    forceSync: () => safeDataStoreCall('forceSync'),
    clearAllData: () => safeDataStoreCall('clearAllData'),
    getChangeHistory: () => safeDataStoreCall('getChangeHistory') || [],
    initializeWithMockData: () => safeDataStoreCall('initializeWithMockData'),
  };
};