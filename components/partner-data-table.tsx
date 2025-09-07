"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react"
import type { Partner } from "@/lib/interfaces" // Updated import

interface PartnerDataTableProps {
  partners: Partner[]
  onPartnerSelect?: (partner: Partner) => void
}

type SortField = keyof Partner | "none"
type SortDirection = "asc" | "desc" | "none"

export function PartnerDataTable({ partners, onPartnerSelect }: PartnerDataTableProps) {
  const [sortField, setSortField] = useState<SortField>("novaScore") // Changed from mlScore
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "none" : "asc")
      if (sortDirection === "desc") setSortField("none")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    if (sortDirection === "asc") return <ArrowUp className="w-4 h-4" />
    if (sortDirection === "desc") return <ArrowDown className="w-4 h-4" />
    return <ArrowUpDown className="w-4 h-4" />
  }

  const filteredAndSortedPartners = useMemo(() => {
    const filtered = partners.filter((partner) => {
      const matchesSearch =
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRisk = riskFilter === "all" || partner.riskLevel === riskFilter
      return matchesSearch && matchesRisk
    })

    if (sortField !== "none" && sortDirection !== "none") {
      filtered.sort((a, b) => {
        let aValue = a[sortField]
        let bValue = b[sortField]

        // Handle array fields (take average)
        if (Array.isArray(aValue)) aValue = aValue.reduce((sum, val) => sum + val, 0) / aValue.length
        if (Array.isArray(bValue)) bValue = bValue.reduce((sum, val) => sum + val, 0) / bValue.length

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Handle numeric comparison
        const numA = Number(aValue)
        const numB = Number(bValue)
        return sortDirection === "asc" ? numA - numB : numB - numA
      })
    }

    return filtered
  }, [partners, searchTerm, riskFilter, sortField, sortDirection])

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "low":
        return "default" // Using default variant for better contrast
      case "medium":
        return "secondary" // Using secondary variant for better contrast
      case "high":
        return "destructive" // Using destructive variant for better contrast
      default:
        return "outline"
    }
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 800) return "default" // Using default variant for better contrast
    if (score >= 700) return "secondary" // Using secondary variant for better contrast
    if (score >= 600) return "outline" // Using outline variant for better contrast
    return "destructive" // Using destructive variant for better contrast
  }

  const getRiskBadgeClasses = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
      case "medium":
        return "bg-amber-600 text-white border-amber-600 hover:bg-amber-700"
      case "high":
        return "bg-red-600 text-white border-red-600 hover:bg-red-700"
      default:
        return "bg-gray-600 text-white border-gray-600 hover:bg-gray-700"
    }
  }

  const getScoreBadgeClasses = (score: number) => {
    if (score >= 800) return "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
    if (score >= 700) return "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
    if (score >= 600) return "bg-amber-600 text-white border-amber-600 hover:bg-amber-700"
    return "bg-red-600 text-white border-red-600 hover:bg-red-700"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // Helper to convert novaScore (0-1000) back to a sentiment-like scale (-1 to 1) for display
  const novaScoreToSentiment = (novaScore: number) => (novaScore / 1000) * 2 - 1;

  const getSentimentColor = (novaScore: number) => {
    const sentiment = novaScoreToSentiment(novaScore);
    if (sentiment > 0.3) return "text-chart-2"
    if (sentiment < -0.3) return "text-destructive"
    return "text-muted-foreground"
  }

  const getRiskBadgeStyle = (risk: string) => {
    switch (risk) {
      case "low":
        return { backgroundColor: "#047857", color: "#ffffff", border: "1px solid #047857" }
      case "medium":
        return { backgroundColor: "#b45309", color: "#ffffff", border: "1px solid #b45309" }
      case "high":
        return { backgroundColor: "#b91c1c", color: "#ffffff", border: "1px solid #b91c1c" }
      default:
        return { backgroundColor: "#374151", color: "#ffffff", border: "1px solid #374151" }
    }
  }

  const getScoreBadgeStyle = (score: number) => {
    if (score >= 800) return { backgroundColor: "#047857", color: "#ffffff", border: "1px solid #047857" }
    if (score >= 700) return { backgroundColor: "#1d4ed8", color: "#ffffff", border: "1px solid #1d4ed8" }
    if (score >= 600) return { backgroundColor: "#b45309", color: "#ffffff", border: "1px solid #b45309" }
    return { backgroundColor: "#b91c1c", color: "#ffffff", border: "1px solid #b91c1c" }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Partner Data Table</CardTitle>
            <CardDescription>
              Comprehensive view of all gig economy partners with Nova scores and performance metrics
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-4">
            {filteredAndSortedPartners.length} partners
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={riskFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRiskFilter("all")}
            >
              All Risk
            </Button>
            <Button
              variant={riskFilter === "low" ? "default" : "outline"}
              size="sm"
              onClick={() => setRiskFilter("low")}
            >
              Low
            </Button>
            <Button
              variant={riskFilter === "medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setRiskFilter("medium")}
            >
              Medium
            </Button>
            <Button
              variant={riskFilter === "high" ? "default" : "outline"}
              size="sm"
              onClick={() => setRiskFilter("high")}
            >
              High
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 p-0 font-medium" onClick={() => handleSort("name")}>
                    Partner
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("novaScore")} // Changed from mlScore
                  >
                    Nova Score
                    {getSortIcon("novaScore")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("novaScore")} // Changed from mlScore
                  >
                    Sentiment
                    {getSortIcon("novaScore")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("tripVolume")}
                  >
                    Trip Volume
                    {getSortIcon("tripVolume")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("onTimePickupRate")} // Changed from onTimeRate
                  >
                    On-Time Rate
                    {getSortIcon("onTimePickupRate")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("vehicleCondition")}
                  >
                    Vehicle
                    {getSortIcon("vehicleCondition")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("avgRating")}
                  >
                    Avg Rating
                    {getSortIcon("avgRating")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0 font-medium"
                    onClick={() => handleSort("riskLevel")}
                  >
                    Risk Level
                    {getSortIcon("riskLevel")}
                  </Button>
                </TableHead>
                <TableHead>Forecast</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPartners.map((partner) => {
                const avgEarnings =
                  partner.earningsHistory.reduce((sum, val) => sum + val, 0) / partner.earningsHistory.length
                const forecastTrend =
                  partner.forecastedEarnings[partner.forecastedEarnings.length - 1] - partner.forecastedEarnings[0]
                const sentimentValue = novaScoreToSentiment(partner.novaScore); // Convert novaScore back to sentiment for display

                return (
                  <TableRow
                    key={partner.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onPartnerSelect?.(partner)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">{partner.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono"
                        style={getScoreBadgeStyle(partner.novaScore)} // Changed from novaScore
                      >
                        {partner.novaScore}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getSentimentColor(partner.novaScore)}`}>
                          {sentimentValue > 0 ? "+" : ""}
                          {sentimentValue.toFixed(2)}
                        </span>
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sentimentValue > 0.3
                                ? "bg-chart-2"
                                : sentimentValue < -0.3
                                  ? "bg-destructive"
                                  : "bg-muted-foreground"
                            }`}
                            style={{ width: `${Math.abs(sentimentValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{partner.tripVolume}</span>
                      <div className="text-xs text-muted-foreground">this month</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPercentage(partner.onTimePickupRate)}</span> {/* Changed from onTimeRate */}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{partner.vehicleCondition}/100</span>
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              partner.vehicleCondition >= 80
                                ? "bg-chart-2"
                                : partner.vehicleCondition >= 60
                                  ? "bg-accent"
                                  : "bg-destructive"
                            }`}
                            style={{ width: `${partner.vehicleCondition}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{partner.avgRating.toFixed(1)}</span>
                      <div className="text-xs text-muted-foreground">★ rating</div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={getRiskBadgeStyle(partner.riskLevel)}
                      >
                        {partner.riskLevel.toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(avgEarnings)}</div>
                        <div className={`text-xs ${forecastTrend > 0 ? "text-chart-2" : "text-destructive"}`}>
                          {forecastTrend > 0 ? "+" : ""}
                          {formatCurrency(forecastTrend)} trend
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}