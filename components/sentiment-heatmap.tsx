"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Partner } from "@/lib/mock-data"

interface SentimentHeatmapProps {
  partners: Partner[]
}

interface HeatmapCell {
  partnerId: string
  partnerName: string
  period: string
  mlScore: number // Changed from sentiment
  tripCount: number
  avgRating: number
}

export function SentimentHeatmap({ partners }: SentimentHeatmapProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly")

  // Generate time periods for the heatmap
  const generateTimePeriods = () => {
    if (viewMode === "monthly") {
      return ["Oct 2023", "Nov 2023", "Dec 2023", "Jan 2024", "Feb 2024", "Mar 2024"]
    } else {
      return ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]
    }
  }

  // Generate mock sentiment data for heatmap visualization
  const generateHeatmapData = (): HeatmapCell[] => {
    const periods = generateTimePeriods()
    const data: HeatmapCell[] = []

    partners.forEach((partner) => {
      periods.forEach((period, index) => {
        // Generate realistic mlScore variations over time
        const baseMlScore = partner.mlScore
        const variation = (Math.random() - 0.5) * 100 // ±50 variation on a 0-1000 scale
        const periodMlScore = Math.max(0, Math.min(1000, baseMlScore + variation))

        // Generate trip counts that correlate with mlScore
        const baseTripCount = Math.floor(partner.tripVolume / periods.length)
        const tripVariation = Math.floor((Math.random() - 0.5) * 20)
        const tripCount = Math.max(5, baseTripCount + tripVariation)

        data.push({
          partnerId: partner.id,
          partnerName: partner.name,
          period,
          mlScore: periodMlScore,
          tripCount,
          avgRating: Math.max(1, Math.min(5, partner.avgRating + (Math.random() - 0.5) * 0.6)),
        })
      })
    })

    return data
  }

  const heatmapData = generateHeatmapData()
  const periods = generateTimePeriods()

  // Helper to convert mlScore (0-1000) back to a sentiment-like scale (-1 to 1) for display
  const mlScoreToSentiment = (mlScore: number) => (mlScore / 1000) * 2 - 1;

  const getSentimentColor = (mlScore: number) => {
    const sentiment = mlScoreToSentiment(mlScore);
    if (sentiment > 0.5) return "bg-emerald-500"
    if (sentiment > 0.2) return "bg-emerald-400"
    if (sentiment > -0.1) return "bg-yellow-400"
    if (sentiment > -0.4) return "bg-orange-500"
    return "bg-red-500"
  }

  const getSentimentIntensity = (mlScore: number) => {
    const sentiment = mlScoreToSentiment(mlScore);
    const intensity = Math.abs(sentiment)
    if (intensity > 0.7) return "opacity-100"
    if (intensity > 0.4) return "opacity-80"
    if (intensity > 0.2) return "opacity-60"
    return "opacity-40"
  }

  const getSentimentLabel = (mlScore: number) => {
    const sentiment = mlScoreToSentiment(mlScore);
    if (sentiment > 0.5) return "Excellent"
    if (sentiment > 0.2) return "Good"
    if (sentiment > -0.1) return "Neutral"
    if (sentiment > -0.4) return "Poor"
    return "Critical"
  }

  const getPartnerData = (partnerId: string, period: string) => {
    return heatmapData.find((d) => d.partnerId === partnerId && d.period === period)
  }

  // Calculate summary statistics
  const avgSentimentByPeriod = periods.map((period) => {
    const periodData = heatmapData.filter((d) => d.period === period)
    const avgMlScore = periodData.reduce((sum, d) => sum + d.mlScore, 0) / periodData.length
    return { period, avg: mlScoreToSentiment(avgMlScore) } // Convert back to sentiment for display
  })

  const partnerSummaries = partners
    .map((partner) => {
      const partnerData = heatmapData.filter((d) => d.partnerId === partner.id)
      const avgMlScore = partnerData.reduce((sum, d) => sum + d.mlScore, 0) / partnerData.length
      const totalTrips = partnerData.reduce((sum, d) => sum + d.tripCount, 0)
      return { partner, avgSentiment: mlScoreToSentiment(avgMlScore), totalTrips } // Convert back to sentiment for display
    })
    .sort((a, b) => b.avgSentiment - a.avgSentiment)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Sentiment Heatmap</CardTitle>
              <CardDescription>
                Visual analysis of customer sentiment patterns across partners and time periods
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={viewMode === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("weekly")}
              >
                Weekly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                <div className="p-3 text-sm font-medium text-muted-foreground">Partner</div>
                {periods.map((period) => (
                  <div key={period} className="p-3 text-sm font-medium text-center text-muted-foreground">
                    {period}
                  </div>
                ))}
              </div>

              {/* Data Rows */}
              {partners.map((partner) => (
                <div key={partner.id} className="grid grid-cols-7 gap-1 mb-1">
                  <div className="p-3 bg-card border border-border rounded-md">
                    <div className="text-sm font-medium text-foreground truncate">{partner.name}</div>
                    <div className="text-xs text-muted-foreground">Score: {partner.mlScore}</div> {/* Changed from novaScore */}
                  </div>
                  {periods.map((period) => {
                    const cellData = getPartnerData(partner.id, period)
                    if (!cellData) return <div key={period} className="p-3 bg-muted rounded-md" />

                    const sentimentValue = mlScoreToSentiment(cellData.mlScore); // Convert mlScore back to sentiment for display

                    return (
                      <div
                        key={period}
                        className={`p-3 rounded-md border border-border cursor-pointer hover:scale-105 transition-transform ${getSentimentColor(cellData.mlScore)} ${getSentimentIntensity(cellData.mlScore)}`}
                        title={`${partner.name} - ${period}\nSentiment: ${sentimentValue.toFixed(2)}\nTrips: ${cellData.tripCount}\nRating: ${cellData.avgRating.toFixed(1)}`}
                      >
                        <div className="text-xs font-medium text-white text-center">
                          {sentimentValue.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/80 text-center">{cellData.tripCount} trips</div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-3">Sentiment Scale</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Excellent (0.5+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-400 rounded"></div>
                <span className="text-xs text-muted-foreground">Good (0.2 to 0.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-xs text-muted-foreground">Neutral (-0.1 to 0.2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Poor (-0.4 to -0.1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Critical (-0.4+)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Period Performance</CardTitle>
            <CardDescription>Average sentiment trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {avgSentimentByPeriod.map((data, index) => (
                <div key={data.period} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.period}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getSentimentColor(data.avg)}`}
                        style={{ width: `${Math.abs(data.avg) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{data.avg.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">
                      {getSentimentLabel(data.avg)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Partners with highest average sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {partnerSummaries.slice(0, 5).map((summary, index) => (
                <div key={summary.partner.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{summary.partner.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{summary.totalTrips} trips</span>
                    <Badge variant={summary.avgSentiment > 0.3 ? "default" : "secondary"}>
                      {summary.avgSentiment.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}