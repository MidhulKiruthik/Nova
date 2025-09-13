// Download a blank template Excel file for partner import
export function downloadTemplateExcel(filename = "nova-partner-template.xlsx") {
  const columns = [
    "ID", "Age", "Gender", "Ethnicity", "AreaType", "Name", "Mail", "Phone", "Nova Score", "Trip Volume", "On-Time Rate", "Leaves Taken", "Medical Stability", "Vehicle Condition", "Risk Level", "Join Date", "Total Trips", "Avg Rating", "Cancellation Rate", "Earnings Jan", "Earnings Feb", "Earnings Mar", "Earnings Apr", "Earnings May", "Earnings Jun", "Earnings Jul", "Earnings Aug", "Forecast Sept", "Forecast Oct", "Forecast Nov", "Forecast Dec", "Reviews", "sentiment"
  ];
  const ws = XLSX.utils.aoa_to_sheet([columns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  // Ensure we pass an ArrayBuffer (not a Uint8Array) to Blob to satisfy TypeScript DOM typings
  const templateBlobData = excelBuffer instanceof Uint8Array ? excelBuffer.buffer : (excelBuffer as any)
  const blob = new Blob([templateBlobData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
import * as XLSX from "xlsx"
import type { Partner, FairnessMetric } from "./interfaces" // Updated import

export interface ExcelPartnerData {
  ID: string
  Age: string // Renamed from Age Group for template
  Gender: string
  Ethnicity: string
  AreaType: string // Changed from "Area Type" to "AreaType"
  Name: string
  Mail: string // Changed from Email to Mail
  Phone: string
  "Nova Score": number
  "Trip Volume": number
  "On-Time Rate": number
  "Leaves Taken": number
  "Medical Stability": string // Renamed from Medical State
  "Vehicle Condition": number
  "Risk Level": string
  "Join Date": string
  "Total Trips": number
  "Avg Rating": number
  "Cancellation Rate": number
  "Earnings Jan": number
  "Earnings Feb": number
  "Earnings Mar": number
  "Earnings Apr": number
  "Earnings May": number
  "Earnings Jun": number
  "Earnings Jul": number // New
  "Earnings Aug": number // New
  "Forecast Sept": number // Changed from "Forecast Sep" to "Forecast Sept"
  "Forecast Oct": number
  "Forecast Nov": number
  "Forecast Dec": number
  Reviews: string // Renamed from reviews
  "sentiment"?: number // Corrected: Use lowercase "sentiment" as per user's Excel
}

// Convert Partner object to Excel-friendly format
export const partnerToExcelRow = (partner: Partner): ExcelPartnerData => {
  return {
    ID: partner.id,
    Age: partner.ageGroup || "",
    Gender: partner.gender || "",
    Ethnicity: partner.ethnicity || "",
    AreaType: partner.areaType || "", // Mapped to AreaType
    Name: partner.name,
    Mail: partner.email, // Mapped to Mail
    Phone: partner.phone,
    "Nova Score": partner.novaScore,
    "Trip Volume": partner.tripVolume,
    "On-Time Rate": partner.onTimePickupRate,
    "Leaves Taken": partner.leavesTaken,
    "Medical Stability": partner.medicalStability,
    "Vehicle Condition": partner.vehicleCondition,
    "Risk Level": partner.riskLevel,
    "Join Date": partner.joinDate,
    "Total Trips": partner.totalTrips,
    "Avg Rating": partner.avgRating,
    "Cancellation Rate": partner.cancellationRate,
    "Earnings Jan": partner.earningsHistory[0] || 0,
    "Earnings Feb": partner.earningsHistory[1] || 0,
    "Earnings Mar": partner.earningsHistory[2] || 0,
    "Earnings Apr": partner.earningsHistory[3] || 0,
    "Earnings May": partner.earningsHistory[4] || 0,
    "Earnings Jun": partner.earningsHistory[5] || 0,
    "Earnings Jul": partner.earningsHistory[6] || 0, // New
    "Earnings Aug": partner.earningsHistory[7] || 0, // New
    "Forecast Sept": partner.forecastedEarnings[0] || 0, // Mapped to "Forecast Sept"
    "Forecast Oct": partner.forecastedEarnings[1] || 0,
    "Forecast Nov": partner.forecastedEarnings[2] || 0,
    "Forecast Dec": partner.forecastedEarnings[3] || 0,
    Reviews: partner.rawReviewsText || "",
    "sentiment": partner.overallSentimentScore, // Corrected: Use lowercase "sentiment" for writing
  }
}

// Convert Excel row to Partner object with robust type parsing
export const excelRowToPartner = (row: ExcelPartnerData): Partner => {
  const parseNumber = (value: any) => (typeof value === 'number' ? value : Number(value) || 0);
  const parseString = (value: any) => (typeof value === 'string' ? value.trim() : String(value || '')).trim();

  // Corrected: Read from "sentiment" (lowercase)
  const parsedSentiment = row["sentiment"] !== undefined ? parseNumber(row["sentiment"]) : undefined;

  // Debugging logs
  console.log(`Processing partner: ${row.Name} (ID: ${row.ID})`);
  console.log(`Raw Sentiment from Excel:`, row["sentiment"], `(Type: ${typeof row["sentiment"]})`);
  console.log(`Parsed overallSentimentScore:`, parsedSentiment, `(Type: ${typeof parsedSentiment})`);


  return {
    id: parseString(row.ID) || `p${Date.now()}`,
    name: parseString(row.Name),
    email: parseString(row.Mail), // Mapped from Mail
    phone: parseString(row.Phone),
    novaScore: parseNumber(row["Nova Score"]),
    earningsHistory: [
      parseNumber(row["Earnings Jan"]),
      parseNumber(row["Earnings Feb"]),
      parseNumber(row["Earnings Mar"]),
      parseNumber(row["Earnings Apr"]),
      parseNumber(row["Earnings May"]),
      parseNumber(row["Earnings Jun"]),
      parseNumber(row["Earnings Jul"]), // New
      parseNumber(row["Earnings Aug"]), // New
    ],
    tripVolume: parseNumber(row["Trip Volume"]),
    onTimePickupRate: parseNumber(row["On-Time Rate"]),
    leavesTaken: parseNumber(row["Leaves Taken"]),
    medicalStability: (parseString(row["Medical Stability"]) as any) || "stable",
    vehicleCondition: parseNumber(row["Vehicle Condition"]),
    forecastedEarnings: [
      parseNumber(row["Forecast Sept"]), // Mapped from "Forecast Sept"
      parseNumber(row["Forecast Oct"]),
      parseNumber(row["Forecast Nov"]),
      parseNumber(row["Forecast Dec"]),
    ],
    riskLevel: (parseString(row["Risk Level"]) as any) || "medium",
    joinDate: parseString(row["Join Date"]) || new Date().toISOString().split("T")[0],
    lastActive: new Date().toISOString().split("T")[0], // Last Active is not in the new template, so default to current date
    totalTrips: parseNumber(row["Total Trips"]),
    avgRating: parseNumber(row["Avg Rating"]),
    cancellationRate: parseNumber(row["Cancellation Rate"]),
    ageGroup: parseString(row.Age), // Mapped from 'Age'
    areaType: parseString(row.AreaType), // Mapped from 'AreaType'
    gender: parseString(row.Gender),
    ethnicity: parseString(row.Ethnicity),
    rawReviewsText: parseString(row.Reviews),
    overallSentimentScore: parsedSentiment, // New: Read sentiment
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
  // Normalize to ArrayBuffer for Blob constructor to satisfy TypeScript's strict typings
  const excelBlobData = excelBuffer instanceof Uint8Array ? excelBuffer.buffer : (excelBuffer as any)
  const blob = new Blob([excelBlobData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

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
    filtered = filtered.filter((p) => p.novaScore >= min && p.novaScore <= max)
  }

  return filtered
}

export const createAnalyticsReport = (partners: Partner[], fairnessMetrics: FairnessMetric[]): ExportReport => {
  const filteredPartners = partners

  // Summary statistics: include all partner columns for each partner
  const summaryData = filteredPartners.map(partnerToExcelRow)

  // Score distribution
  const scoreDistribution = [
    {
      "Score Range": "800+",
      Count: filteredPartners.filter((p) => p.novaScore >= 800).length,
      Percentage:
        ((filteredPartners.filter((p) => p.novaScore >= 800).length / filteredPartners.length) * 100).toFixed(1) + "%",
    },
    {
      "Score Range": "700-799",
      Count: filteredPartners.filter((p) => p.novaScore >= 700 && p.novaScore < 800).length,
      Percentage:
        (
          (filteredPartners.filter((p) => p.novaScore >= 700 && p.novaScore < 800).length / filteredPartners.length) *
          100
        ).toFixed(1) + "%",
    },
    {
      "Score Range": "600-699",
      Count: filteredPartners.filter((p) => p.novaScore >= 600 && p.novaScore < 700).length,
      Percentage:
        (
          (filteredPartners.filter((p) => p.novaScore >= 600 && p.novaScore < 700).length / filteredPartners.length) *
          100
        ).toFixed(1) + "%",
    },
    {
      "Score Range": "Below 600",
      Count: filteredPartners.filter((p) => p.novaScore < 600).length,
      Percentage:
        ((filteredPartners.filter((p) => p.novaScore < 600).length / filteredPartners.length) * 100).toFixed(1) + "%",
    },
  ]

  // Performance metrics
  const performanceMetrics = filteredPartners.map((partner) => ({
    "Partner Name": partner.name,
    "Nova Score": partner.novaScore,
    "Risk Level": partner.riskLevel,
    "Total Trips": partner.totalTrips,
    "Average Rating": partner.avgRating,
    "On-Time Rate": partner.onTimePickupRate,
    "Cancellation Rate": partner.cancellationRate,
    "Vehicle Condition": partner.vehicleCondition,
    "Monthly Earnings Avg": Math.round(
      partner.earningsHistory.reduce((sum, e) => sum + e, 0) / partner.earningsHistory.length,
    ),
    "Overall Sentiment": partner.overallSentimentScore, // New: Include overall sentiment
  }))

  // Fairness analysis
  const fairnessAnalysis = fairnessMetrics.map((metric) => ({
    "Demographic Category": metric.category,
    "Demographic Group": metric.group,
    "Average Nova Score": metric.averageScore,
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
        "Jul Earnings": partner.earningsHistory[6] || 0, // New
        "Aug Earnings": partner.earningsHistory[7] || 0, // New
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
        "Current Nova Score": partner.novaScore,
        "Forecast Sept": partner.forecastedEarnings[0] || 0, // Mapped to "Forecast Sept"
        "Forecast Oct": partner.forecastedEarnings[1] || 0,
        "Forecast Nov": partner.forecastedEarnings[2] || 0,
        "Forecast Dec": partner.forecastedEarnings[3] || 0,
        "Projected Total": partner.forecastedEarnings.reduce((sum, e) => sum + e, 0),
        "Growth Trend": partner.forecastedEarnings[3] > partner.earningsHistory[7] ? "Positive" : "Negative", // Compare Dec forecast with Aug earnings
      }))
    : []

  // Explicitly type sheets as ExportReport['sheets'] so we can push differently-shaped data arrays later
  const sheets: ExportReport['sheets'] = [{ name: "Partners", data: partnerData }]

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
    "Demographic Category": metric.category,
    "Demographic Group": metric.group,
    "Average Nova Score": metric.averageScore,
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

  // Compliance summary
  const compliantGroups = fairnessMetrics.filter((m) => Math.abs(m.bias) <= 0.05).length;
  const totalGroups = fairnessMetrics.length;

  const complianceSummary = [
    {
      "Total Demographics Analyzed": totalGroups,
      "Compliant Groups": compliantGroups,
      "Groups Requiring Attention": totalGroups - compliantGroups,
      "Overall Compliance Rate": totalGroups > 0 ? ((compliantGroups / totalGroups) * 100).toFixed(1) + "%" : "0%",
      "Report Date": new Date().toLocaleDateString(),
    },
  ]

  return {
    filename: `nova-fairness-compliance-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheets: [
      { name: "Compliance Summary", data: complianceSummary },
      { name: "Bias Analysis", data: biasAnalysis },
    ],
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: partners.length, // Total partners considered for fairness
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
  // Normalize to ArrayBuffer for Blob constructor
  const reportBlobData = excelBuffer instanceof Uint8Array ? excelBuffer.buffer : (excelBuffer as any)
  const blob = new Blob([reportBlobData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = report.filename
  link.click()

  URL.revokeObjectURL(link.href)
}
