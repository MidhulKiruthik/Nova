"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
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
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { Partner } from "@/lib/interfaces";

interface PartnerProfileViewProps {
  partner: Partner;
  onBack: () => void;
}

export function PartnerProfileView({ partner, onBack }: PartnerProfileViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Memoized averages
  const avgEarnings = useMemo(
    () => partner.earningsHistory.reduce((sum, val) => sum + val, 0) / partner.earningsHistory.length,
    [partner.earningsHistory]
  );

  const avgForecast = useMemo(
    () => partner.forecastedEarnings.reduce((sum, val) => sum + val, 0) / partner.forecastedEarnings.length,
    [partner.forecastedEarnings]
  );

  // Historical performance data
  const historicalScores = useMemo(() => {
    const data: { month: string; score: number; earnings: number }[] = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = Math.max(6, partner.earningsHistory.length);

    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth - (months - 1 - i) + 12) % 12;
      const yearOffset = currentMonth < (months - 1 - i) ? 1 : 0;
      const year = currentYear - yearOffset;
      const monthName = new Date(year, monthIndex).toLocaleString("en-US", { month: "short" });
      const scoreVariation = (Math.random() - 0.5) * 30;
      const historicalScore = Math.max(
        300,
        Math.min(850, partner.novaScore + scoreVariation - (months - 1 - i) * 2)
      );
      const historicalEarnings = i < partner.earningsHistory.length
        ? partner.earningsHistory[i]
        : Math.max(500, avgEarnings + (Math.random() - 0.5) * 800);

      data.push({ month: monthName, score: Math.round(historicalScore), earnings: Math.round(historicalEarnings) });
    }
    return data;
  }, [partner.earningsHistory, partner.novaScore, avgEarnings]);

  // Forecast data
  const forecastData = useMemo(() => partner.forecastedEarnings.map((earnings, index) => ({
    month: new Date(new Date().getFullYear(), new Date().getMonth() + index + 1).toLocaleString("en-US", { month: "short" }),
    earnings,
    confidence: 85 + Math.random() * 10,
  })), [partner.forecastedEarnings]);

  // Metrics for progress bars
  const performanceMetrics = [
    { metric: "Trip Volume", value: Math.min(partner.tripVolume / 10, 100) },
    { metric: "On-Time Rate", value: partner.onTimePickupRate * 100 },
    { metric: "Vehicle Condition", value: partner.vehicleCondition },
    { metric: "Customer Rating", value: partner.avgRating * 20 },
  ];

  // Radar chart data
  const radarData = [
    { subject: "Reliability", A: partner.onTimePickupRate * 100, fullMark: 100 },
    { subject: "Earnings", A: Math.min(avgEarnings / 50, 100), fullMark: 100 },
    { subject: "Customer Satisfaction", A: partner.avgRating * 20, fullMark: 100 },
    { subject: "Vehicle Quality", A: partner.vehicleCondition, fullMark: 100 },
    { subject: "Trip Volume", A: Math.min(partner.tripVolume / 10, 100), fullMark: 100 },
    { subject: "Health Stability", A: Math.max(100 - partner.leavesTaken * 10, 0), fullMark: 100 },
  ];

  // Sentiment breakdown
  const sentimentBreakdown = useMemo(() => {
    const sentiment = (partner.novaScore / 1000) * 2 - 1;
    if (sentiment > 0.3) return { positive: 85, neutral: 12, negative: 3 };
    if (sentiment > 0) return { positive: 65, neutral: 25, negative: 10 };
    if (sentiment > -0.3) return { positive: 35, neutral: 45, negative: 20 };
    return { positive: 15, neutral: 25, negative: 60 };
  }, [partner.novaScore]);

  // Risk level
  const getRiskLevel = (score: number) => {
    if (score >= 800) return { level: "Low", color: "bg-green-500", textColor: "text-green-700" };
    if (score >= 700) return { level: "Medium", color: "bg-yellow-500", textColor: "text-yellow-700" };
    if (score >= 600) return { level: "High", color: "bg-orange-500", textColor: "text-orange-700" };
    return { level: "Critical", color: "bg-red-500", textColor: "text-red-700" };
  };
  const risk = getRiskLevel(partner.novaScore);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                {partner.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{partner.name}</h1>
                <p className="text-sm text-muted-foreground">Partner ID: {partner.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={risk.textColor}>{risk.level} Risk</Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{partner.novaScore}</div>
              <p className="text-xs text-muted-foreground">Nova Score</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Nova Score */}
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

              {/* Monthly Earnings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">${Math.round(avgForecast).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(85 + Math.random() * 10)}%</p>
                </CardContent>
              </Card>

              {/* Trip Volume */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Trip Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{partner.tripVolume}</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              {/* Customer Rating */}
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
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Components */}
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

              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>Multi-dimensional performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[300px]" config={{ score: { label: "Performance" } }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Historical Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
                <CardDescription>Nova Score trends over past months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[400px]" config={{ score: { label: "Nova Score" } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalScores}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Sentiment Analysis</CardTitle>
                <CardDescription>Review sentiment breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">{sentimentBreakdown.positive}%</div>
                    <p className="text-sm text-muted-foreground">Positive Reviews</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-600">{sentimentBreakdown.neutral}%</div>
                    <p className="text-sm text-muted-foreground">Neutral Reviews</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600">{sentimentBreakdown.negative}%</div>
                    <p className="text-sm text-muted-foreground">Negative Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Forecast</CardTitle>
                <CardDescription>Predicted earnings based on historical patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[400px]" config={{ earnings: { label: "Earnings" } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="earnings" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
