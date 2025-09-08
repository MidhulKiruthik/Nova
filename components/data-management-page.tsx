"use client"

import { ExcelImport } from "./excel-import"
import { ExportManager } from "./export-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet } from "lucide-react"
import { useDataStore } from "@/hooks/use-data-store"
import { toast } from "sonner"

export function DataManagementPage() {
  const { partners, fairnessMetrics, setPartners } = useDataStore()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Data Management
          </CardTitle>
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