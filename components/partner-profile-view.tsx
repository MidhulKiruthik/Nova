"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { Partner } from "@/lib/mock-data"

interface PartnerProfileViewProps {
  partner: Partner
  onBack: () => void
}

export function PartnerProfileView({ partner, onBack }: PartnerProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const avgEarnings = partner.earningsHistory.reduce((sum, val) => sum + val, 0) / partner.earningsHistory.length
  const avgForecast = partner.forecastedEarnings.reduce((sum, val) => sum + val, 0) / partner.forecastedEarnings.length

  // Generate historical data for charts
  const historicalScores = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i).toLocaleDateString("en-US", { month: "short" }),
    score: partner.novaScore + Math.random() * 40 - 20,
    earnings: avgEarnings + Math.random() * 1000 - 500,
  }))

  const forecastData = partner.forecastedEarnings.map((earnings, index) => ({
    month: new Date(2024, index + 1).toLocaleDateString("en-US", { month: "short" }),
    earnings: earnings,
    confidence: 85 + Math.random() * 10,
  }))

  const performanceMetrics = [
    { metric: "Trip Volume", value: Math.min(partner.tripVolume / 10, 100), max: 100, color: "hsl(var(--chart-1))" },
    { metric: "On-Time Rate", value: partner.onTimePickupRate * 100, max: 100, color: "hsl(var(--chart-2))" },
    { metric: "Vehicle Condition", value: partner.vehicleCondition, max: 100, color: "hsl(var(--chart-3))" },
    { metric: "Customer Rating", value: partner.avgRating * 20, max: 100, color: "hsl(var(--chart-4))" },
  ]

  const radarData = [
    { subject: "Reliability", A: partner.onTimePickupRate * 100, fullMark: 100 },
    { subject: "Earnings", A: Math.min(avgEarnings / 50, 100), fullMark: 100 },
    { subject: "Customer Satisfaction", A: partner.avgRating * 20, fullMark: 100 },
    { subject: "Vehicle Quality", A: partner.vehicleCondition, fullMark: 100 },
    { subject: "Trip Volume", A: Math.min(partner.tripVolume / 10, 100), fullMark: 100 },
    { subject: "Health Stability", A: Math.max(100 - partner.leavesTaken * 10, 0), fullMark: 100 },
  ]

  const getSentimentBreakdown = (score: number) => {
    if (score > 0.3) return { positive: 85, neutral: 12, negative: 3 }
    if (score > 0) return { positive: 65, neutral: 25, negative: 10 }
    if (score > -0.3) return { positive: 35, neutral: 45, negative: 20 }
    return { positive: 15, neutral: 25, negative: 60 }
  }

  const sentimentBreakdown = getSentimentBreakdown(partner.sentimentScore)

  const getRiskLevel = (score: number) => {
    if (score >= 800) return { level: "Low", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 700) return { level: "Medium", color: "bg-yellow-500", textColor: "text-yellow-700" }
    if (score >= 600) return { level: "High", color: "bg-orange-500", textColor: "text-orange-700" }
    return { level: "Critical", color: "bg-red-500", textColor: "text-red-700" }
  }

  const risk = getRiskLevel(partner.novaScore)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {partner.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{partner.name}</h1>
                  <p className="text-sm text-muted-foreground">Partner ID: {partner.id}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={risk.textColor}>
                {risk.level} Risk
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{partner.novaScore}</div>
                <p className="text-xs text-muted-foreground">Nova Score</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Nova Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{partner.novaScore}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {partner.novaScore > 750 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {partner.novaScore > 750 ? "+12 this month" : "-8 this month"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">${Math.round(avgForecast).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {Math.round(85 + Math.random() * 10)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trip Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{partner.tripVolume}</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customer Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{partner.avgRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Average rating</p>
                </CardContent>
              </Card>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Components</CardTitle>
                  <CardDescription>Detailed breakdown of Nova Score factors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(metric.value)}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>Multi-dimensional performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Key risk factors and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Risk Factors</h4>
                    {partner.leavesTaken > 5 && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">High medical leave frequency</span>
                      </div>
                    )}
                    {partner.vehicleCondition < 70 && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Poor vehicle condition</span>
                      </div>
                    )}
                    {partner.onTimePickupRate < 0.8 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Below average punctuality</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Positive Indicators</h4>
                    {partner.avgRating > 4.5 && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Excellent customer ratings</span>
                      </div>
                    )}
                    {partner.tripVolume > 150 && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">High trip volume</span>
                      </div>
                    )}
                    {partner.novaScore > 750 && (
                      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Strong credit profile</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
                <CardDescription>Nova Score trends over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={historicalScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Sentiment Analysis</CardTitle>
                <CardDescription>Review sentiment breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{sentimentBreakdown.positive}%</div>
                    <p className="text-sm text-muted-foreground">Positive Reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{sentimentBreakdown.neutral}%</div>
                    <p className="text-sm text-muted-foreground">Neutral Reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{sentimentBreakdown.negative}%</div>
                    <p className="text-sm text-muted-foreground">Negative Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Forecast</CardTitle>
                <CardDescription>Predicted earnings based on historical patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
