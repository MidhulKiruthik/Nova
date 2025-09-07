"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from "lucide-react"
import type { Partner } from "@/lib/interfaces" // Updated import
import { readExcelFile, createExcelFile } from "@/lib/excel-utils"
import { toast } from "sonner" // Import sonner toast

interface ExcelImportProps {
  onImportComplete: (partners: Partner[]) => void
  onImportError: (error: string) => void
}

interface ImportValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validRecords: number
  totalRecords: number
}

export function ExcelImport({ onImportComplete, onImportError }: ExcelImportProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [previewData, setPreviewData] = useState<Partner[]>([])
  const [validation, setValidation] = useState<ImportValidation | null>(null)
  const [importStep, setImportStep] = useState<"upload" | "preview" | "complete">("upload")

  const validatePartnerData = (partners: Partner[]): ImportValidation => {
    const errors: string[] = []
    const warnings: string[] = []
    let validRecords = 0

    partners.forEach((partner, index) => {
      const rowNum = index + 2 // Excel row number (accounting for header)

      // Required field validation
      if (!partner.name || partner.name.trim() === "") {
        errors.push(`Row ${rowNum}: Name is required`)
      }
      if (!partner.email || !partner.email.includes("@")) {
        errors.push(`Row ${rowNum}: Valid email is required`)
      }
      if (partner.novaScore < 0 || partner.novaScore > 1000) { // Changed from mlScore
        errors.push(`Row ${rowNum}: Nova Score must be between 0-1000`) // Changed from ML Score
      }

      // Warning validations
      if (partner.onTimePickupRate < 0 || partner.onTimePickupRate > 1) {
        warnings.push(`Row ${rowNum}: On-time rate should be between 0-1`)
      }
      if (partner.avgRating < 0 || partner.avgRating > 5) {
        warnings.push(`Row ${rowNum}: Average rating should be between 0-5`)
      }
      if (partner.vehicleCondition < 0 || partner.vehicleCondition > 100) {
        warnings.push(`Row ${rowNum}: Vehicle condition should be between 0-100`)
      }

      // Count valid records
      if (
        partner.name &&
        partner.email &&
        partner.email.includes("@") &&
        partner.novaScore >= 0 && // Changed from mlScore
        partner.novaScore <= 1000 // Changed from mlScore
      ) {
        validRecords++
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRecords,
      totalRecords: partners.length,
    }
  }

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
    setImportStep("preview")
    toast.loading("Processing Excel file...", { id: "excel-import" })

    try {
      // Simulate progress updates
      setImportProgress(25)

      const partners = await readExcelFile(file)
      setImportProgress(50)

      const validationResult = validatePartnerData(partners)
      setImportProgress(75)

      setPreviewData(partners)
      setValidation(validationResult)
      setImportProgress(100)
      toast.success("File processed. Please review and confirm import.", { id: "excel-import" })
    } catch (error) {
      console.error("Import error:", error)
      onImportError("Failed to process Excel file. Please check the format.")
      toast.error("Failed to process Excel file. Please check the format.", { id: "excel-import" })
      setImportStep("upload")
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmImport = () => {
    if (validation?.isValid && previewData.length > 0) {
      onImportComplete(previewData)
      setImportStep("complete")
    } else if (validation && !validation.isValid) {
      toast.error("Cannot import due to validation errors. Please fix them or upload a different file.")
    }
  }

  const downloadTemplate = () => {
    const templateData: Partner[] = [
      {
        id: "template",
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0123",
        novaScore: 750, // Changed from mlScore
        earningsHistory: [2500, 2700, 2600, 2800, 2650, 2750],
        tripVolume: 120,
        onTimePickupRate: 0.92,
        leavesTaken: 3,
        medicalStability: "stable",
        vehicleCondition: 85,
        forecastedEarnings: [2800, 2900, 2750, 3000, 2850],
        riskLevel: "low",
        joinDate: "2023-01-15",
        lastActive: "2024-01-14",
        totalTrips: 1200,
        avgRating: 4.7,
        cancellationRate: 0.04,
      },
    ]

    const excelBuffer = createExcelFile(templateData)
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "nova-partners-template.xlsx"
    link.click()

    URL.revokeObjectURL(link.href)
    toast.info("Download started for Excel template.")
  }

  const resetImport = () => {
    setImportStep("upload")
    setPreviewData([])
    setValidation(null)
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
        <CardDescription>Import partner data from Excel files with validation and preview</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={importStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={importStep !== "upload"}>
              Upload File
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={importStep !== "preview"}>
              Preview & Validate
            </TabsTrigger>
            <TabsTrigger value="complete" disabled={importStep !== "complete"}>
              Import Complete
            </TabsTrigger>
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
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
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

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Data Preview & Validation</h3>
              <Button variant="outline" onClick={resetImport}>
                Upload Different File
              </Button>
            </div>

            {validation && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{validation.totalRecords}</div>
                      <p className="text-xs text-muted-foreground">Total Records</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-chart-2">{validation.validRecords}</div>
                      <p className="text-xs text-muted-foreground">Valid Records</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-destructive">{validation.errors.length}</div>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </CardContent>
                  </Card>
                </div>

                {validation.errors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Validation Errors:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {validation.errors.length > 5 && <li>... and {validation.errors.length - 5} more errors</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.warnings.slice(0, 3).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                        {validation.warnings.length > 3 && (
                          <li>... and {validation.warnings.length - 3} more warnings</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="border rounded-lg">
                  <div className="p-4 border-b">
                    <h4 className="font-medium">Data Preview (First 5 Records)</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Nova Score</th> {/* Changed from ML Score */}
                          <th className="text-left p-3 font-medium">Risk Level</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((partner, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{partner.name}</td>
                            <td className="p-3">{partner.email}</td>
                            <td className="p-3">{partner.novaScore}</td> {/* Changed from mlScore */}
                            <td className="p-3">
                              <Badge
                                variant={
                                  partner.riskLevel === "low"
                                    ? "default"
                                    : partner.riskLevel === "medium"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {partner.riskLevel}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {partner.name && partner.email && partner.email.includes("@") ? (
                                <Badge variant="default">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Invalid
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button onClick={confirmImport} disabled={!validation.isValid}>
                    Import {validation.validRecords} Records
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="complete" className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-chart-2" />
              <h3 className="text-xl font-medium mb-2">Import Successful!</h3>
              <p className="text-muted-foreground mb-6">
                {validation?.validRecords} partners have been imported successfully.
              </p>
              <Button onClick={resetImport}>Import Another File</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}