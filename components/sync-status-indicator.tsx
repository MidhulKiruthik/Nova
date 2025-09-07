"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, WifiOff } from "lucide-react"
import { dataStore, type SyncStatus } from "@/lib/data-store"

export function SyncStatusIndicator() {
  // Initialize with a default value that is consistent for SSR
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: "idle", lastSync: null, pendingChanges: 0 })
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const currentDataStore = dataStore.instance; // Access the client-side instance

    // Initial sync status load
    setSyncStatus(currentDataStore.getSyncStatus());

    const unsubscribe = currentDataStore.subscribeSyncStatus(setSyncStatus)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
    }

    return () => {
      unsubscribe()
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-3 h-3" />

    switch (syncStatus.status) {
      case "syncing":
        return <RefreshCw className="w-3 h-3 animate-spin" />
      case "error":
        return <AlertCircle className="w-3 h-3" />
      case "offline":
        return <CloudOff className="w-3 h-3" />
      default:
        return syncStatus.pendingChanges > 0 ? <Cloud className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />
    }
  }

  const getStatusText = () => {
    if (!isOnline) return "Offline"

    switch (syncStatus.status) {
      case "syncing":
        return "Syncing..."
      case "error":
        return "Sync Error"
      case "offline":
        return "Offline"
      default:
        return syncStatus.pendingChanges > 0 ? `${syncStatus.pendingChanges} pending` : "Synced"
    }
  }

  const getStatusVariant = () => {
    if (!isOnline || syncStatus.status === "offline") return "secondary"
    if (syncStatus.status === "error") return "destructive"
    if (syncStatus.status === "syncing" || syncStatus.pendingChanges > 0) return "default"
    return "secondary"
  }

  const getTooltipContent = () => {
    const lastSync = syncStatus.lastSync ? `Last synced: ${syncStatus.lastSync.toLocaleTimeString()}` : "Never synced"

    if (syncStatus.error) {
      return `${lastSync}\nError: ${syncStatus.error}`
    }

    return lastSync
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-pre-line">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>

        {(syncStatus.status === "error" || syncStatus.pendingChanges > 0) && isOnline && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dataStore.instance.forceSync()}
            disabled={syncStatus.status === "syncing"}
          >
            <RefreshCw className={`w-3 h-3 ${syncStatus.status === "syncing" ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>
    </TooltipProvider>
  )
}