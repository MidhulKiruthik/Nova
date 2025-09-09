"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useDataStore } from "@/hooks/use-data-store"
import { toast } from "sonner"

export function SyncNowButton() {
  const { forceSync } = useDataStore()

  const handleSync = async () => {
    try {
      toast.loading('Syncing with server...', { id: 'sync' })
      await forceSync()
      toast.success('Sync complete', { id: 'sync' })
    } catch (err) {
      console.error('Sync error', err)
      toast.error('Sync failed', { id: 'sync' })
    }
  }

  return (
    <Button onClick={handleSync} variant="outline" size="sm">
      <RefreshCw className="w-4 h-4 mr-2" />
      Sync now
    </Button>
  )
}
