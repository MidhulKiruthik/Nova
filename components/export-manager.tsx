"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Download, FileSpreadsheet, Users } from "lucide-react"
import type { Partner, FairnessMetric } from "@/lib/interfaces"
import {
  createAnalyticsReport,
  createDetailedReport,
  createFairnessReport,
  downloadReport,
  downloadExcelFile,
  type ExportOptions,
} from "@/lib/excel-utils"
import { toast } from "sonner"

interface ExportManagerProps {
  partners: Partner[]
  fairnessMetrics: FairnessMetric[]
}

export function ExportManager({ partners, fairnessMetrics }: ExportManagerProps) {
  const [exportType, setExportType] = useState<"simple">("simple") // Only 'simple' option now
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeEarningsHistory: true,
    includeForecast: true,
    includeReviews: false,
    filterByRiskLevel: "all",
    filterByScoreRange: { min: 0, max: 1000 },
    reportType: "summary",
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    toast.loading("Generating report...", { id: "export-report" })

    try {
      // Only simple export logic remains
      downloadExcelFile(partners, `nova-partners-${new Date().toISOString().split("T")[0]}.xlsx`)
      toast.success("Report generated and download started!", { id: "export-report" })
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Export failed. Please try again.", { id: "export-report" })
    } finally {
      setIsExporting(false)
    }
  }

  const getExportDescription = () => {
    return "Basic partner data in a single Excel sheet"
  }

  const getFilteredCount = () => {
    let filtered = partners

    if (exportOptions.filterByRiskLevel && exportOptions.filterByRiskLevel !== "all") {
      filtered = filtered.filter((p) => p.riskLevel === exportOptions.filterByRiskLevel)
    }

    if (exportOptions.filterByScoreRange) {
      const { min, max } = exportOptions.filterByScoreRange
      filtered = filtered.filter((p) => p.novaScore >= min && p.novaScore <= max)
    }

    return filtered.length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Export Manager
        </CardTitle>
        <CardDescription>Generate comprehensive Excel reports with customizable options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection - now only one option */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Report Type</Label>
          <div className="grid grid-cols-1 gap-3"> {/* Only one column needed */}
            <Button
              variant="default" // Always default as it's the only option
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setExportType("simple")} // Still set, but effectively fixed
            >
              <Users className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium">Simple Export</div>
                <div className="text-xs text-muted-foreground">Basic partner data</div>
              </div>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{getExportDescription()}</p>
        </div>

        <Separator />

        {/* Export Options - Removed as only simple export remains */}
        {/* <div className="space-y-4">
            <Label className="text-base font-medium">Export Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Include Additional Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="earnings-history"
                      checked={exportOptions.includeEarningsHistory}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeEarningsHistory: !!checked }))
                      }
                    />
                    <Label htmlFor="earnings-history">Earnings History</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="forecast"
                      checked={exportOptions.includeForecast}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, includeForecast: !!checked }))
                      }
                    />
                    <Label htmlFor="forecast">Earnings Forecast</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Filters</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="risk-filter" className="text-sm">
                      Risk Level
                    </Label>
                    <Select
                      value={exportOptions.filterByRiskLevel}
                      onValueChange={(value) =>
                        setExportOptions((prev) => ({ ...prev, filterByRiskLevel: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="low">Low Risk Only</SelectItem>
                        <SelectItem value="medium">Medium Risk Only</SelectItem>
                        <SelectItem value="high">High Risk Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-score" className="text-sm">
                        Min Score
                      </Label>
                      <Input
                        id="min-score"
                        type="number"
                        min="0"
                        max="1000"
                        value={exportOptions.filterByScoreRange?.min || 0}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            filterByScoreRange: {
                              ...prev.filterByScoreRange!,
                              min: Number.parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-score" className="text-sm">
                        Max Score
                      </Label>
                      <Input
                        id="max-score"
                        type="number"
                        min="0"
                        max="1000"
                        value={exportOptions.filterByScoreRange?.max || 1000}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            filterByScoreRange: {
                              ...prev.filterByScoreRange!,
                              max: Number.parseInt(e.target.value) || 1000,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

        <Separator />

        {/* Export Summary */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Export Summary</Label>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {getFilteredCount()} of {partners.length} partners
            </Badge>
            {exportOptions.filterByRiskLevel !== "all" && (
              <Badge variant="outline">Risk: {exportOptions.filterByRiskLevel}</Badge>
            )}
            {exportOptions.filterByScoreRange &&
              (exportOptions.filterByScoreRange.min > 0 || exportOptions.filterByScoreRange.max < 1000) && (
                <Badge variant="outline">
                  Score: {exportOptions.filterByScoreRange.min}-{exportOptions.filterByScoreRange.max}
                </Badge>
              )}
          </div>
        </div>

        {/* Export Button */}
        <Button onClick={handleExport} disabled={isExporting || getFilteredCount() === 0} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          {isExporting
            ? "Generating Export..."
            : `Export ${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`}
        </Button>
      </CardContent>
    </Card>
  )
}