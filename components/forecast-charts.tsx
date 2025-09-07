"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import type { Partner } from "@/lib/mock-data"

interface ForecastChartsProps {
  partners: Partner[]
}

export function ForecastCharts({ partners }: ForecastChartsProps) {
  const [selectedPartner, setSelectedPartner] = useState<string>(partners[0]?.id || "")
  const [forecastPeriod, setForecastPeriod] = useState<"3months" | "6months" | "12months">("6months")

  const validatePartners = (partners: Partner[]) => {
    return partners.filter(
      (partner) =>
        partner &&
        typeof partner.novaScore === "number" &&
        Array.isArray(partner.earningsHistory) &&
        Array.isArray(partner.forecastedEarnings),
    )
  }

  const validPartners = validatePartners(partners)

  if (validPartners.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No valid partner data available for forecasting.</p>
        </CardContent>
      </Card>
    )
  }

  // Generate historical and forecast data
  const generateForecastData = () => {
    const months = forecastPeriod === "3months" ? 3 : forecastPeriod === "6months" ? 6 : 12
    const historicalMonths = 6

    const data = []
    const currentDate = new Date()

    // Historical data
    for (let i = historicalMonths; i > 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

      const avgScore = validPartners.reduce((sum, p) => sum + p.novaScore, 0) / validPartners.length
      const variation = (Math.random() - 0.5) * 40
      const historicalScore = Math.max(300, Math.min(850, avgScore + variation))

      const avgEarnings =
        validPartners.reduce((sum, p) => {
          const partnerAvg = p.earningsHistory.reduce((s, e) => s + e, 0) / p.earningsHistory.length
          return sum + partnerAvg
        }, 0) / validPartners.length

      data.push({
        month: monthName,
        novaScore: Math.round(historicalScore),
        earnings: Math.round(avgEarnings + (Math.random() - 0.5) * 500),
        riskScore: Math.round(100 - (historicalScore / 850) * 100),
        isHistorical: true,
      })
    }

    // Current month
    const avgScore = validPartners.reduce((sum, p) => sum + p.novaScore, 0) / validPartners.length
    const avgEarnings =
      validPartners.reduce((sum, p) => {
        const partnerAvg = p.earningsHistory.reduce((s, e) => s + e, 0) / p.earningsHistory.length
        return sum + partnerAvg
      }, 0) / validPartners.length

    data.push({
      month: currentDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      novaScore: Math.round(avgScore),
      earnings: Math.round(avgEarnings),
      riskScore: Math.round(100 - (avgScore / 850) * 100),
      isHistorical: false,
      isCurrent: true,
    })

    // Forecast data
    for (let i = 1; i <= months; i++) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() + i)
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

      // Trend-based forecasting with some randomness
      const trendFactor = 1 + i * 0.02 // Slight upward trend
      const forecastScore = Math.max(300, Math.min(850, avgScore * trendFactor + (Math.random() - 0.5) * 30))
      const forecastEarnings = Math.round(avgEarnings * trendFactor + (Math.random() - 0.5) * 400)

      data.push({
        month: monthName,
        novaScore: Math.round(forecastScore),
        earnings: forecastEarnings,
        riskScore: Math.round(100 - (forecastScore / 850) * 100),
        isHistorical: false,
        isForecast: true,
      })
    }

    return data
  }

  const forecastData = generateForecastData()

  // Individual partner forecast
  const generatePartnerForecast = (partnerId: string) => {
    const partner = validPartners.find((p) => p.id === partnerId)
    if (!partner) return []

    const data = []
    const currentDate = new Date()

    // Historical earnings
    partner.earningsHistory.forEach((earnings, index) => {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() - (partner.earningsHistory.length - index))
      data.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        actual: earnings,
        forecast: null,
        novaScore: partner.novaScore + (Math.random() - 0.5) * 50,
      })
    })

    // Forecast
    partner.forecastedEarnings.forEach((earnings, index) => {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() + index + 1)
      data.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        actual: null,
        forecast: earnings,
        novaScore: partner.novaScore + index * 5 + (Math.random() - 0.5) * 30,
      })
    })

    return data
  }

  const partnerForecastData = generatePartnerForecast(selectedPartner)
  const selectedPartnerData = validPartners.find((p) => p.id === selectedPartner)

  // Risk distribution forecast
  const riskForecastData = [
    { name: "Low Risk", current: 45, forecast: 52, color: "#10b981" },
    { name: "Medium Risk", current: 35, forecast: 32, color: "#f59e0b" },
    { name: "High Risk", current: 20, forecast: 16, color: "#ef4444" },
  ]

  const chartConfig = {
    novaScore: {
      label: "Nova Score",
      color: "hsl(var(--chart-1))",
    },
    earnings: {
      label: "Earnings",
      color: "hsl(var(--chart-2))",
    },
    riskScore: {
      label: "Risk Score",
      color: "hsl(var(--chart-3))",
    },
    actual: {
      label: "Actual",
      color: "hsl(var(--chart-1))",
    },
    forecast: {
      label: "Forecast",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nova Score Forecast Charts</CardTitle>
              <CardDescription>Predictive analytics for Nova scores, earnings, and risk assessments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={forecastPeriod === "3months" ? "default" : "outline"}
                size="sm"
                onClick={() => setForecastPeriod("3months")}
              >
                3M
              </Button>
              <Button
                variant={forecastPeriod === "6months" ? "default" : "outline"}
                size="sm"
                onClick={() => setForecastPeriod("6months")}
              >
                6M
              </Button>
              <Button
                variant={forecastPeriod === "12months" ? "default" : "outline"}
                size="sm"
                onClick={() => setForecastPeriod("12months")}
              >
                12M
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova Score Trend Forecast</CardTitle>
            <CardDescription>Historical performance and predicted Nova score evolution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[300, 850]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="novaScore"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={(props) => {
                      // Validate props to prevent null cx/cy errors
                      if (!props || typeof props.cx !== "number" || typeof props.cy !== "number" || !props.payload) {
                        return null
                      }

                      const { payload, cx, cy } = props
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={
                            payload.isCurrent
                              ? "var(--color-accent)"
                              : payload.isForecast
                                ? "var(--color-chart-2)"
                                : "var(--color-chart-1)"
                          }
                          stroke={
                            payload.isCurrent
                              ? "var(--color-accent)"
                              : payload.isForecast
                                ? "var(--color-chart-2)"
                                : "var(--color-chart-1)"
                          }
                          strokeWidth={2}
                        />
                      )
                    }}
                    strokeDasharray={(dataPoint) => (dataPoint.isForecast ? "5 5" : "0")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Forecast</CardTitle>
            <CardDescription>Average partner earnings projection</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Partner Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Individual Partner Forecast</CardTitle>
              <CardDescription>Detailed earnings and score predictions for selected partner</CardDescription>
            </div>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              {validPartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name} (Score: {partner.novaScore})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={partnerForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="var(--color-actual)"
                      strokeWidth={2}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="var(--color-forecast)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-4">
              {selectedPartnerData && (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Current Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nova Score</span>
                        <Badge variant="default">{selectedPartnerData.novaScore}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Level</span>
                        <Badge
                          variant={
                            selectedPartnerData.riskLevel === "low"
                              ? "default"
                              : selectedPartnerData.riskLevel === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {selectedPartnerData.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Avg Rating</span>
                        <span className="text-sm font-medium">{selectedPartnerData.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Forecast Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expected Growth</span>
                        <span className="text-sm font-medium text-chart-2">+8.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Trend</span>
                        <span className="text-sm font-medium text-chart-2">Improving</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <span className="text-sm font-medium">87%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution Forecast</CardTitle>
            <CardDescription>Predicted changes in risk level distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskForecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current" fill="var(--color-chart-1)" name="Current" />
                  <Bar dataKey="forecast" fill="var(--color-chart-2)" name="Forecast" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Insights</CardTitle>
            <CardDescription>Key predictions and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                  <h4 className="font-medium text-foreground">Positive Trend</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall Nova scores expected to increase by 5.2% over the next 6 months
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <h4 className="font-medium text-foreground">Risk Reduction</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  High-risk partners projected to decrease by 20% through improved support programs
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h4 className="font-medium text-foreground">Earnings Growth</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Average partner earnings forecasted to grow 12% year-over-year
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
