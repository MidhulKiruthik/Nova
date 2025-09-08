"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react"
import type { Partner } from "@/lib/interfaces"

interface PartnerDataTableProps {
  partners: Partner[]
  onPartnerSelect?: (partner: Partner) => void
}

type SortField = keyof Partner | "none"
type SortDirection = "asc" | "desc" | "none"

export function PartnerDataTable({ partners, onPartnerSelect }: PartnerDataTableProps) {
  const [sortField, setSortField] = useState<SortField>("novaScore")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all")
  const [genderFilter, setGenderFilter] = useState<string>("all")

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
        partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.ageGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.ethnicity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.areaType.toLowerCase().includes(searchTerm.toLowerCase());

      // Derive risk level for filtering based on Nova Score
      let derivedRiskLevel: "low" | "medium" | "high";
      if (partner.novaScore > 750) {
        derivedRiskLevel = "low";
      } else if (partner.novaScore >= 700 && partner.novaScore <= 750) {
        derivedRiskLevel = "medium";
      } else {
        derivedRiskLevel = "high";
      }

      const matchesRisk = riskFilter === "all" || derivedRiskLevel === riskFilter;
      const matchesAgeGroup = ageGroupFilter === "all" || partner.ageGroup === ageGroupFilter;
      const matchesGender = genderFilter === "all" || partner.gender === genderFilter;

      return matchesSearch && matchesRisk && matchesAgeGroup && matchesGender;
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
  }, [partners, searchTerm, riskFilter, ageGroupFilter, genderFilter, sortField, sortDirection])

  // Updated function to derive risk level and style based on Nova Score
  const getRiskLevelAndStyle = (novaScore: number) => {
    if (novaScore > 750) {
      return { level: "Low", style: { backgroundColor: "#047857", color: "#ffffff", border: "1px solid #047857" } };
    } else if (novaScore >= 700 && novaScore <= 750) {
      return { level: "Medium", style: { backgroundColor: "#b45309", color: "#ffffff", border: "1px solid #b45309" } };
    } else {
      return { level: "High", style: { backgroundColor: "#b91c1c", color: "#ffffff", border: "1px solid #b91c1c" } };
    }
  };

  const getScoreBadgeStyle = (score: number) => {
    if (score >= 800) return { backgroundColor: "#047857", color: "#ffffff", border: "1px solid #047857" }
    if (score >= 700) return { backgroundColor: "#1d4ed8", color: "#ffffff", border: "1px solid #1d4ed8" }
    if (score >= 600) return { backgroundColor: "#b45309", color: "#ffffff", border: "1px solid #b45309" }
    return { backgroundColor: "#b91c1c", color: "#ffffff", border: "1px solid #b91c1c" }
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

  // Helper to convert numerical sentiment score (0-5) to a sentiment-like scale (0-5) for display
  const getSentimentDisplayScore = (partner: Partner) => {
    return partner.overallSentimentScore !== undefined
      ? partner.overallSentimentScore
      : (partner.novaScore / 1000) * 5; // Fallback to Nova Score if no explicit sentiment
  }

  const getSentimentColor = (sentimentScore: number) => {
    if (sentimentScore > 3.5) return "text-chart-2" // Positive
    if (sentimentScore < 1.5) return "text-destructive" // Negative
    return "text-muted-foreground" // Neutral
  }

  // Extract unique age groups and genders for filters
  const uniqueAgeGroups = useMemo(() => {
    const groups = new Set(partners.map(p => p.ageGroup).filter(Boolean));
    return ["all", ...Array.from(groups).sort()];
  }, [partners]);

  const uniqueGenders = useMemo(() => {
    const genders = new Set(partners.map(p => p.gender).filter(Boolean));
    return ["all", ...Array.from(genders).sort()];
  }, [partners]);


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
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
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
          <div className="flex items-center gap-2">
            <label htmlFor="age-group-filter" className="sr-only">Age Group</label>
            <select
              id="age-group-filter"
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              {uniqueAgeGroups.map(group => (
                <option key={group} value={group}>
                  {group === "all" ? "All Age Groups" : group}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="gender-filter" className="sr-only">Gender</label>
            <select
              id="gender-filter"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              {uniqueGenders.map(gender => (
                <option key={gender} value={gender}>
                  {gender === "all" ? "All Genders" : gender}
                </option>
              ))}
            </select>
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
                    onClick={() => handleSort("novaScore")}
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
                    onClick={() => handleSort("overallSentimentScore")}
                  >
                    Sentiment
                    {getSortIcon("overallSentimentScore")}
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
                    onClick={() => handleSort("onTimePickupRate")}
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
                const sentimentDisplay = getSentimentDisplayScore(partner);
                const { level: derivedRiskLevel, style: derivedRiskStyle } = getRiskLevelAndStyle(partner.novaScore);


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
                        style={getScoreBadgeStyle(partner.novaScore)}
                      >
                        {partner.novaScore}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getSentimentColor(sentimentDisplay)}`}>
                          {sentimentDisplay.toFixed(1)}/5
                        </span>
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sentimentDisplay > 3.5
                                ? "bg-chart-2"
                                : sentimentDisplay < 1.5
                                  ? "bg-destructive"
                                  : "bg-muted-foreground"
                            }`}
                            style={{ width: `${(sentimentDisplay / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{partner.tripVolume}</span>
                      <div className="text-xs text-muted-foreground">this month</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatPercentage(partner.onTimePickupRate)}</span>
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
                        style={derivedRiskStyle}
                      >
                        {derivedRiskLevel.toUpperCase()}
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