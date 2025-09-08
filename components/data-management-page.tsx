"use client"

import { ExcelImport } from "./excel-import"
import { ExportManager } from "./export-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, Trash2 } from "lucide-react"
import { useDataStore } from "@/hooks/use-data-store"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DataManagementPage() {
  const { partners, fairnessMetrics, setPartners, clearAllData } = useDataStore()

  const handleClearAllData = () => {
    clearAllData()
    toast.success("All application data cleared successfully!")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              <CardTitle>Data Management</CardTitle>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all partner data, reviews, and fairness metrics from your local storage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <CardDescription>Import new partner data from Excel or export existing data for analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ExcelImport
            onImportComplete={(importedPartners) => {
              setPartners(importedPartners)
              toast.success(`${importedPartners.length} partners imported successfully!`)
            }}
            onImportError={(error) => {
              toast.error(`Import failed: ${error}`)
            }}
          />
          <ExportManager partners={partners} fairnessMetrics={fairnessMetrics} />
        </CardContent>
      </Card>
    </div>
  )
}