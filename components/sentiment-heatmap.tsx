"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Partner, Review } from "@/lib/interfaces"
import { useDataStore } from "@/hooks/use-data-store"

interface SentimentHeatmapProps {
  partners: Partner[]
}

interface HeatmapCell {
  partnerId: string
  partnerName: string
  period: string
  novaScore: number
  tripCount: number
  avgRating: number
  sentimentScore: number // Directly use sentiment score
}

export function SentimentHeatmap({ partners }: SentimentHeatmapProps) {
  const { reviews } = useDataStore(); // Get reviews from data store
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly")

  // Generate time periods for the heatmap
  const generateTimePeriods = () => {
    if (viewMode === "monthly") {
      // Generate last 6 months dynamically
      const periods = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        periods.push(date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      }
      return periods;
    } else {
      // For weekly, we'll just use generic labels for now as we don't have granular date data
      return ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]
    }
  }

  // Generate sentiment data for heatmap visualization
  const generateHeatmapData = useMemo((): HeatmapCell[] => {
    const periods = generateTimePeriods();
    const data: HeatmapCell[] = [];

    partners.forEach((partner) => {
      periods.forEach((period, index) => {
        // Filter reviews relevant to this partner
        const partnerReviews = reviews.filter(r => r.partnerId === partner.id);
        
        // Calculate average sentiment score for the partner (or period if granular data existed)
        const avgSentimentForPartner = partnerReviews.length > 0 
          ? partnerReviews.reduce((sum, r) => sum + (r.sentimentScore || 2.5), 0) / partnerReviews.length
          : 2.5; // Default to neutral if no reviews

        // Convert average sentiment (0-5) to novaScore scale (0-1000) for consistency
        const periodNovaScore = (avgSentimentForPartner / 5) * 1000;

        // Generate trip counts that correlate with novaScore
        const baseTripCount = Math.floor(partner.tripVolume / periods.length);
        const tripVariation = Math.floor((Math.random() - 0.5) * 20);
        const tripCount = Math.max(5, baseTripCount + tripVariation);

        data.push({
          partnerId: partner.id,
          partnerName: partner.name,
          period,
          novaScore: Math.round(periodNovaScore),
          tripCount,
          avgRating: partner.avgRating, // Use partner's overall avgRating
          sentimentScore: parseFloat(avgSentimentForPartner.toFixed(1)),
        });
      });
    });

    return data;
  }, [partners, reviews, viewMode]); // Re-generate when partners, reviews, or viewMode changes

  const periods = generateTimePeriods()

  const getSentimentColor = (sentimentScore: number) => {
    if (sentimentScore > 3.5) return "bg-emerald-500" // Positive
    if (sentimentScore > 2.5) return "bg-emerald-400" // Slightly positive
    if (sentimentScore > 1.5) return "bg-yellow-400" // Neutral
    if (sentimentScore > 0.5) return "bg-orange-500" // Slightly negative
    return "bg-red-500" // Negative
  }

  const getSentimentIntensity = (sentimentScore: number) => {
    const intensity = Math.abs(sentimentScore - 2.5) / 2.5; // Normalize intensity from 0 (neutral) to 1 (extreme)
    if (intensity > 0.7) return "opacity-100"
    if (intensity > 0.4) return "opacity-80"
    if (intensity > 0.2) return "opacity-60"
    return "opacity-40"
  }

  const getSentimentLabel = (sentimentScore: number) => {
    if (sentimentScore > 3.5) return "Excellent"
    if (sentimentScore > 2.5) return "Good"
    if (sentimentScore > 1.5) return "Neutral"
    if (sentimentScore > 0.5) return "Poor"
    return "Critical"
  }

  const getPartnerDataForPeriod = (partnerId: string, period: string) => {
    return heatmapData.find((d) => d.partnerId === partnerId && d.period === period)
  }

  // Calculate summary statistics
  const avgSentimentByPeriod = periods.map((period) => {
    const periodData = heatmapData.filter((d) => d.period === period)
    const avgSentiment = periodData.reduce((sum, d) => sum + d.sentimentScore, 0) / periodData.length
    return { period, avg: avgSentiment }
  })

  const partnerSummaries = partners
    .map((partner) => {
      const partnerData = heatmapData.filter((d) => d.partnerId === partner.id)
      const avgSentiment = partnerData.reduce((sum, d) => sum + d.sentimentScore, 0) / partnerData.length
      const totalTrips = partnerData.reduce((sum, d) => sum + d.tripCount, 0)
      return { partner, avgSentiment: avgSentiment, totalTrips }
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
                    <div className="text-xs text-muted-foreground">Score: {partner.novaScore}</div>
                  </div>
                  {periods.map((period) => {
                    const cellData = getPartnerDataForPeriod(partner.id, period)
                    if (!cellData) return <div key={period} className="p-3 bg-muted rounded-md" />

                    return (
                      <div
                        key={period}
                        className={`p-3 rounded-md border border-border cursor-pointer hover:scale-105 transition-transform ${getSentimentColor(cellData.sentimentScore)} ${getSentimentIntensity(cellData.sentimentScore)}`}
                        title={`${partner.name} - ${period}\nSentiment: ${cellData.sentimentScore.toFixed(1)}/5\nTrips: ${cellData.tripCount}\nRating: ${cellData.avgRating.toFixed(1)}`}
                      >
                        <div className="text-xs font-medium text-white text-center">
                          {cellData.sentimentScore.toFixed(1)}/5
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
            <h4 className="text-sm font-medium text-foreground mb-3">Sentiment Scale (0-5)</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Excellent (3.5+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-400 rounded"></div>
                <span className="text-xs text-muted-foreground">Good (2.5 to 3.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span className="text-xs text-muted-foreground">Neutral (1.5 to 2.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Poor (0.5 to 1.5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-muted-foreground">Critical (0.5-)</span>
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
                        style={{ width: `${(data.avg / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{data.avg.toFixed(1)}/5</span>
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
                <div key={summary.partner.id} className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{summary.partner.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{summary.totalTrips} trips</span>
                    <Badge variant={summary.avgSentiment > 3.5 ? "default" : "secondary"}>
                      {summary.avgSentiment.toFixed(1)}/5
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