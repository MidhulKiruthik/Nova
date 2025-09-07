import * as XLSX from "xlsx"
import type { Partner, FairnessMetric } from "./mock-data"

export interface ExcelPartnerData {
  ID: string
  Name: string
  Email: string
  Phone: string
  "ML Score": number // Renamed from "Nova Score"
  "Trip Volume": number
  "On-Time Rate": number
  "Leaves Taken": number
  "Medical Stability": string
  "Vehicle Condition": number
  // "Sentiment Score": number // Removed
  "Risk Level": string
  "Join Date": string
  "Last Active": string
  "Total Trips": number
  "Avg Rating": number
  "Cancellation Rate": number
  "Earnings Jan": number
  "Earnings Feb": number
  "Earnings Mar": number
  "Earnings Apr": number
  "Earnings May": number
  "Earnings Jun": number
  "Forecast Jan": number
  "Forecast Feb": number
  "Forecast Mar": number
  "Forecast Apr": number
  "Forecast May": number
}

// Convert Partner object to Excel-friendly format
export const partnerToExcelRow = (partner: Partner): ExcelPartnerData => {
  return {
    ID: partner.id,
    Name: partner.name,
    Email: partner.email,
    Phone: partner.phone,
    "ML Score": partner.mlScore, // Changed from novaScore
    "Trip Volume": partner.tripVolume,
    "On-Time Rate": partner.onTimePickupRate,
    "Leaves Taken": partner.leavesTaken,
    "Medical Stability": partner.medicalStability,
    "Vehicle Condition": partner.vehicleCondition,
    // "Sentiment Score": partner.sentimentScore, // Removed
    "Risk Level": partner.riskLevel,
    "Join Date": partner.joinDate,
    "Last Active": partner.lastActive,
    "Total Trips": partner.totalTrips,
    "Avg Rating": partner.avgRating,
    "Cancellation Rate": partner.cancellationRate,
    "Earnings Jan": partner.earningsHistory[0] || 0,
    "Earnings Feb": partner.earningsHistory[1] || 0,
    "Earnings Mar": partner.earningsHistory[2] || 0,
    "Earnings Apr": partner.earningsHistory[3] || 0,
    "Earnings May": partner.earningsHistory[4] || 0,
    "Earnings Jun": partner.earningsHistory[5] || 0,
    "Forecast Jan": partner.forecastedEarnings[0] || 0,
    "Forecast Feb": partner.forecastedEarnings[1] || 0,
    "Forecast Mar": partner.forecastedEarnings[2] || 0,
    "Forecast Apr": partner.forecastedEarnings[3] || 0,
    "Forecast May": partner.forecastedEarnings[4] || 0,
  }
}

// Convert Excel row to Partner object
export const excelRowToPartner = (row: ExcelPartnerData): Partner => {
  return {
    id: row.ID || `p${Date.now()}`,
    name: row.Name || "",
    email: row.Email || "",
    phone: row.Phone || "",
    mlScore: row["ML Score"] || 0, // Changed from novaScore
    earningsHistory: [
      row["Earnings Jan"] || 0,
      row["Earnings Feb"] || 0,
      row["Earnings Mar"] || 0,
      row["Earnings Apr"] || 0,
      row["Earnings May"] || 0,
      row["Earnings Jun"] || 0,
    ],
    tripVolume: row["Trip Volume"] || 0,
    onTimePickupRate: row["On-Time Rate"] || 0,
    leavesTaken: row["Leaves Taken"] || 0,
    medicalStability: (row["Medical Stability"] as any) || "stable",
    vehicleCondition: row["Vehicle Condition"] || 0,
    // customerReviews: [], // Removed
    // sentimentScore: row["Sentiment Score"] || 0, // Removed
    forecastedEarnings: [
      row["Forecast Jan"] || 0,
      row["Forecast Feb"] || 0,
      row["Forecast Mar"] || 0,
      row["Forecast Apr"] || 0,
      row["Forecast May"] || 0,
    ],
    riskLevel: (row["Risk Level"] as any) || "medium",
    joinDate: row["Join Date"] || new Date().toISOString().split("T")[0],
    lastActive: row["Last Active"] || new Date().toISOString().split("T")[0],
    totalTrips: row["Total Trips"] || 0,
    avgRating: row["Avg Rating"] || 0,
    cancellationRate: row["Cancellation Rate"] || 0,
  }
}

// Read Excel file and convert to Partner array
export const readExcelFile = (file: File): Promise<Partner[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelPartnerData[]

        const partners = jsonData.map(excelRowToPartner)
        resolve(partners)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

// Convert Partner array to Excel file
export const createExcelFile = (partners: Partner[]): Uint8Array => {
  const excelData = partners.map(partnerToExcelRow)
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Partners")

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" })
}

// Download Excel file
export const downloadExcelFile = (partners: Partner[], filename = "nova-partners.xlsx") => {
  const excelBuffer = createExcelFile(partners)
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()

  URL.revokeObjectURL(link.href)
}

export interface ExportOptions {
  includeEarningsHistory?: boolean
  includeForecast?: boolean
  includeReviews?: boolean
  filterByRiskLevel?: "low" | "medium" | "high" | "all"
  filterByScoreRange?: { min: number; max: number }
  customFields?: string[]
  reportType?: "summary" | "detailed" | "analytics" | "fairness"
}

export interface ExportReport {
  filename: string
  sheets: { name: string; data: any[] }[]
  metadata: {
    exportDate: string
    totalRecords: number
    filters: string[]
    reportType: string
  }
}

export const filterPartnersForExport = (partners: Partner[], options: ExportOptions): Partner[] => {
  let filtered = [...partners]

  if (options.filterByRiskLevel && options.filterByRiskLevel !== "all") {
    filtered = filtered.filter((p) => p.riskLevel === options.filterByRiskLevel)
  }

  if (options.filterByScoreRange) {
    const { min, max } = options.filterByScoreRange
    filtered = filtered.filter((p) => p.mlScore >= min && p.mlScore <= max) // Changed from novaScore
  }

  return filtered
}

export const createAnalyticsReport = (partners: Partner[], fairnessMetrics: FairnessMetric[]): ExportReport => {
  const filteredPartners = partners

  // Summary statistics
  const summaryData = [
    {
      "Total Partners": filteredPartners.length,
      "Average ML Score": Math.round( // Changed from Nova Score
        filteredPartners.reduce((sum, p) => sum + p.mlScore, 0) / filteredPartners.length, // Changed from novaScore
      ),
      "High Risk Partners": filteredPartners.filter((p) => p.riskLevel === "high").length,
      "Medium Risk Partners": filteredPartners.filter((p) => p.riskLevel === "medium").length,
      "Low Risk Partners": filteredPartners.filter((p) => p.riskLevel === "low").length,
      "Average Rating": (filteredPartners.reduce((sum, p) => sum + p.avgRating, 0) / filteredPartners.length).toFixed(
        2,
      ),
      "Average On-Time Rate": (
        filteredPartners.reduce((sum, p) => sum + p.onTimePickupRate, 0) / filteredPartners.length
      ).toFixed(3),
      "Total Trips": filteredPartners.reduce((sum, p) => sum + p.totalTrips, 0),
    },
  ]

  // Score distribution
  const scoreDistribution = [
    {
      "Score Range": "800+",
      Count: filteredPartners.filter((p) => p.mlScore >= 800).length, // Changed from novaScore
      Percentage:
        ((filteredPartners.filter((p) => p.mlScore >= 800).length / filteredPartners.length) * 100).toFixed(1) + "%", // Changed from novaScore
    },
    {
      "Score Range": "700-799",
      Count: filteredPartners.filter((p) => p.mlScore >= 700 && p.mlScore < 800).length, // Changed from novaScore
      Percentage:
        (
          (filteredPartners.filter((p) => p.mlScore >= 700 && p.mlScore < 800).length / filteredPartners.length) * // Changed from novaScore
          100
        ).toFixed(1) + "%",
    },
    {
      "Score Range": "600-699",
      Count: filteredPartners.filter((p) => p.mlScore >= 600 && p.mlScore < 700).length, // Changed from novaScore
      Percentage:
        (
          (filteredPartners.filter((p) => p.mlScore >= 600 && p.mlScore < 700).length / filteredPartners.length) * // Changed from novaScore
          100
        ).toFixed(1) + "%",
    },
    {
      "Score Range": "Below 600",
      Count: filteredPartners.filter((p) => p.mlScore < 600).length, // Changed from novaScore
      Percentage:
        ((filteredPartners.filter((p) => p.mlScore < 600).length / filteredPartners.length) * 100).toFixed(1) + "%", // Changed from novaScore
    },
  ]

  // Performance metrics
  const performanceMetrics = filteredPartners.map((partner) => ({
    "Partner Name": partner.name,
    "ML Score": partner.mlScore, // Changed from Nova Score
    "Risk Level": partner.riskLevel,
    "Total Trips": partner.totalTrips,
    "Average Rating": partner.avgRating,
    "On-Time Rate": partner.onTimePickupRate,
    "Cancellation Rate": partner.cancellationRate,
    "Vehicle Condition": partner.vehicleCondition,
    // "Sentiment Score": partner.sentimentScore, // Removed
    "Monthly Earnings Avg": Math.round(
      partner.earningsHistory.reduce((sum, e) => sum + e, 0) / partner.earningsHistory.length,
    ),
  }))

  // Fairness analysis
  const fairnessAnalysis = fairnessMetrics.map((metric) => ({
    Demographic: metric.demographic,
    "Average Score": metric.averageScore,
    "Partner Count": metric.count,
    "Bias Score": metric.bias,
    "Bias Level": metric.bias > 0.05 ? "High Positive" : metric.bias < -0.05 ? "High Negative" : "Acceptable",
  }))

  return {
    filename: `nova-analytics-report-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheets: [
      { name: "Summary", data: summaryData },
      { name: "Score Distribution", data: scoreDistribution },
      { name: "Performance Metrics", data: performanceMetrics },
      { name: "Fairness Analysis", data: fairnessAnalysis },
    ],
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: filteredPartners.length,
      filters: ["All Partners"],
      reportType: "Analytics Report",
    },
  }
}

export const createDetailedReport = (partners: Partner[], options: ExportOptions): ExportReport => {
  const filteredPartners = filterPartnersForExport(partners, options)

  // Main partner data
  const partnerData = filteredPartners.map(partnerToExcelRow)

  // Earnings history breakdown
  const earningsData = options.includeEarningsHistory
    ? filteredPartners.map((partner) => ({
        "Partner ID": partner.id,
        "Partner Name": partner.name,
        "Jan Earnings": partner.earningsHistory[0] || 0,
        "Feb Earnings": partner.earningsHistory[1] || 0,
        "Mar Earnings": partner.earningsHistory[2] || 0,
        "Apr Earnings": partner.earningsHistory[3] || 0,
        "May Earnings": partner.earningsHistory[4] || 0,
        "Jun Earnings": partner.earningsHistory[5] || 0,
        "Total Earnings": partner.earningsHistory.reduce((sum, e) => sum + e, 0),
        "Average Monthly": Math.round(
          partner.earningsHistory.reduce((sum, e) => sum + e, 0) / partner.earningsHistory.length,
        ),
      }))
    : []

  // Forecast data
  const forecastData = options.includeForecast
    ? filteredPartners.map((partner) => ({
        "Partner ID": partner.id,
        "Partner Name": partner.name,
        "Current ML Score": partner.mlScore, // Changed from Nova Score
        "Forecast Jan": partner.forecastedEarnings[0] || 0,
        "Forecast Feb": partner.forecastedEarnings[1] || 0,
        "Forecast Mar": partner.forecastedEarnings[2] || 0,
        "Forecast Apr": partner.forecastedEarnings[3] || 0,
        "Forecast May": partner.forecastedEarnings[4] || 0,
        "Projected Total": partner.forecastedEarnings.reduce((sum, e) => sum + e, 0),
        "Growth Trend": partner.forecastedEarnings[4] > partner.earningsHistory[5] ? "Positive" : "Negative",
      }))
    : []

  const sheets = [{ name: "Partners", data: partnerData }]

  if (earningsData.length > 0) {
    sheets.push({ name: "Earnings History", data: earningsData })
  }

  if (forecastData.length > 0) {
    sheets.push({ name: "Earnings Forecast", data: forecastData })
  }

  const filters = []
  if (options.filterByRiskLevel && options.filterByRiskLevel !== "all") {
    filters.push(`Risk Level: ${options.filterByRiskLevel}`)
  }
  if (options.filterByScoreRange) {
    filters.push(`Score Range: ${options.filterByScoreRange.min}-${options.filterByScoreRange.max}`)
  }

  return {
    filename: `nova-detailed-report-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheets,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: filteredPartners.length,
      filters: filters.length > 0 ? filters : ["No filters applied"],
      reportType: "Detailed Report",
    },
  }
}

export const createFairnessReport = (partners: Partner[], fairnessMetrics: FairnessMetric[]): ExportReport => {
  // Bias analysis by demographic
  const biasAnalysis = fairnessMetrics.map((metric) => ({
    "Demographic Group": metric.demographic,
    "Average ML Score": metric.averageScore, // Changed from Nova Score
    "Sample Size": metric.count,
    "Bias Score": metric.bias,
    "Bias Direction": metric.bias > 0 ? "Positive" : metric.bias < 0 ? "Negative" : "Neutral",
    "Compliance Status": Math.abs(metric.bias) <= 0.05 ? "Compliant" : "Requires Attention",
    "Recommended Action":
      Math.abs(metric.bias) > 0.1
        ? "Immediate Review"
        : Math.abs(metric.bias) > 0.05
          ? "Monitor Closely"
          : "Continue Monitoring",
  }))

  // Partner distribution by demographics (simulated)
  const demographicDistribution = [
    {
      "Age Group": "18-30",
      "Partner Count": partners.filter((p) => p.mlScore < 700).length, // Changed from novaScore
      "Avg Score": 682,
      "Risk Distribution": "Mixed",
    },
    {
      "Age Group": "31-45",
      "Partner Count": partners.filter((p) => p.mlScore >= 700 && p.mlScore < 800).length, // Changed from novaScore
      "Avg Score": 724,
      "Risk Distribution": "Mostly Low-Medium",
    },
    {
      "Age Group": "46+",
      "Partner Count": partners.filter((p) => p.mlScore >= 800).length, // Changed from novaScore
      "Avg Score": 698,
      "Risk Distribution": "Low Risk Dominant",
    },
  ]

  // Compliance summary
  const complianceSummary = [
    {
      "Total Demographics Analyzed": fairnessMetrics.length,
      "Compliant Groups": fairnessMetrics.filter((m) => Math.abs(m.bias) <= 0.05).length,
      "Groups Requiring Attention": fairnessMetrics.filter((m) => Math.abs(m.bias) > 0.05).length,
      "High Risk Groups": fairnessMetrics.filter((m) => Math.abs(m.bias) > 0.1).length,
      "Overall Compliance Rate":
        ((fairnessMetrics.filter((m) => Math.abs(m.bias) <= 0.05).length / fairnessMetrics.length) * 100).toFixed(1) +
        "%",
      "Report Date": new Date().toLocaleDateString(),
    },
  ]

  return {
    filename: `nova-fairness-compliance-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheets: [
      { name: "Compliance Summary", data: complianceSummary },
      { name: "Bias Analysis", data: biasAnalysis },
      { name: "Demographic Distribution", data: demographicDistribution },
    ],
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: fairnessMetrics.length,
      filters: ["Fairness Compliance Analysis"],
      reportType: "Fairness Compliance Report",
    },
  }
}

export const createMultiSheetExcelFile = (report: ExportReport): Uint8Array => {
  const workbook = XLSX.utils.book_new()

  // Add metadata sheet
  const metadataSheet = XLSX.utils.json_to_sheet([report.metadata])
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Report Info")

  // Add data sheets
  report.sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data)

    // Apply basic formatting
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")

    // Style header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E2E8F0" } },
          alignment: { horizontal: "center" },
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" })
}

export const downloadReport = (report: ExportReport) => {
  const excelBuffer = createMultiSheetExcelFile(report)
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = report.filename
  link.click()

  URL.revokeObjectURL(link.href)
}