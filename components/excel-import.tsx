"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import { useDataStore } from "@/hooks/use-data-store"

interface ExcelImportProps {
  onImportError: (error: string) => void
  onImportComplete?: (importedPartners: any[]) => void
}

interface Partner {
  name: string
  email: string
  novaScore: number
  riskLevel: string
  ageGroup: string
  gender: string
  ethnicity: string
  areaType: string
  // Add other fields if needed
}

export function ExcelImport({ onImportError, onImportComplete }: ExcelImportProps) {
  const { setPartners } = useDataStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStep, setImportStep] = useState<"upload" | "complete">("upload")

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find((file) => file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))

    if (excelFile) {
      await processFile(excelFile)
    } else {
      onImportError("Please drop a valid Excel file (.xlsx or .xls)")
      toast.error("Please drop a valid Excel file (.xlsx or .xls)")
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setImportProgress(0)
    setImportStep("upload")
    toast.loading("Processing Excel file...", { id: "excel-import" })

    try {
      setImportProgress(25)

      const formData = new FormData()
      formData.append("file", file)

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const response = await fetch(`${apiBase}/process`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        // Try to parse JSON error from server to give better feedback
        let msg = `Pipeline processing failed: ${response.status}`
        try {
          const err = await response.json()
          if (err && err.error) msg += ` - ${err.error}`
          if (err && err.details) msg += `: ${err.details}`
        } catch (_) {}
        throw new Error(msg)
      }

      setImportProgress(50)

      const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)

  // Auto-download processed file
  const link = document.createElement("a")
  link.href = url
  link.download = "partner_dataset_final.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setImportProgress(100)
      setImportStep("complete")
      toast.success("Excel processed and downloaded!", { id: "excel-import" })

      // After successful processing, try to fetch canonical partners from server and notify parent
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const resp = await fetch(`${apiBase}/partners`)
        if (resp.ok) {
          const data = await resp.json()
          if (Array.isArray(data.partners)) {
            // Update parent if provided
            if (typeof onImportComplete === 'function') {
              onImportComplete(data.partners)
            } else {
              // Fallback: update data store directly so UI populates
              setPartners(data.partners)
            }
          }
        }
      } catch (err) {
        // Non-fatal: we already downloaded the file. Parent can choose to ignore.
        console.warn('Could not fetch partners after upload', err)
      }
    } catch (error) {
      console.error("Import error:", error)
  const message = error instanceof Error ? error.message : String(error)
  onImportError?.(message)
  toast.error(message, { id: "excel-import" })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    // Optional: you can provide a local template file for download
    toast.info("Template download not implemented.", { id: "template-download" })
  }

  const resetImport = () => {
    setImportStep("upload")
    setImportProgress(0)
    toast.info("Import process reset.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Excel Data Import
        </CardTitle>
        <CardDescription>Upload partner data Excel file for processing</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={importStep}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Upload Excel File</h3>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drop your Excel file here</h3>
              <p className="text-muted-foreground mb-4">or click to browse files</p>
              <label htmlFor="excel-file-input">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
              <input
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-4">Supports .xlsx and .xls files up to 10MB</p>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-chart-2" />
              <h3 className="text-xl font-medium mb-2">Import Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Your Excel file has been processed and downloaded successfully.
              </p>
              <Button onClick={resetImport}>Import Another File</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
