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
import type { Partner, Review } from "@/lib/interfaces";
import { useDataStore } from "@/hooks/use-data-store";
import { analyzeReviewSentiment } from "@/lib/nova-score-model";


interface PartnerProfileViewProps {
  partner: Partner;
  onBack: () => void;
}

export function PartnerProfileView({ partner, onBack }: PartnerProfileViewProps) {
  const { reviews } = useDataStore(); // Get reviews from data store
  const [activeTab, setActiveTab] = useState("overview");

  const avgEarnings = partner.earningsHistory.length > 0
    ? partner.earningsHistory.reduce((sum, val) => sum + val, 0) / partner.earningsHistory.length
    : 0; // Default to 0 if array is empty
  const avgForecast = partner.forecastedEarnings.length > 0
    ? partner.forecastedEarnings.reduce((sum, val) => sum + val, 0) / partner.forecastedEarnings.length
    : 0; // Default to 0 if array is empty

  const historicalScores = useMemo(() => {
    const data: { month: string; score: number; earnings: number }[] = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    for (let i = 0; i < partner.earningsHistory.length; i++) {
      const monthIndex = (currentMonth - (partner.earningsHistory.length - 1 - i) + 12) % 12;
      const year = currentYear - (currentMonth < (partner.earningsHistory.length - 1 - i) ? 1 : 0);
      const monthName = new Date(year, monthIndex).toLocaleDateString("en-US", { month: "short" });
      const scoreVariation = (Math.random() - 0.5) * 30;
      const historicalScore = Math.max(300, Math.min(850, partner.novaScore + scoreVariation - (partner.earningsHistory.length - 1 - i) * 2));
      data.push({ month: monthName, score: Math.round(historicalScore), earnings: partner.earningsHistory[i] });
    }

    if (partner.earningsHistory.length < 6) {
      const missingMonths = 6 - partner.earningsHistory.length;
      for (let i = 0; i < missingMonths; i++) {
        const monthIndex = (currentMonth - (partner.earningsHistory.length + missingMonths - 1 - i) + 12) % 12;
        const year = currentYear - (currentMonth < (partner.earningsHistory.length + missingMonths - 1 - i) ? 1 : 0);
        const monthName = new Date(year, monthIndex).toLocaleDateString("en-US", { month: "short" });
        const scoreVariation = (Math.random() - 0.5) * 30;
        const historicalScore = Math.max(300, Math.min(850, partner.novaScore + scoreVariation - (partner.earningsHistory.length + missingMonths - 1 - i) * 2));
        const historicalEarnings = Math.max(500, avgEarnings + (Math.random() - 0.5) * 800 - (partner.earningsHistory.length + missingMonths - 1 - i) * 100);
        data.unshift({ month: monthName, score: Math.round(historicalScore), earnings: Math.round(historicalEarnings) });
      }
    }

    return data;
  }, [partner.earningsHistory, partner.novaScore, avgEarnings]);

  const forecastData = useMemo(() => partner.forecastedEarnings.map((earnings, index) => ({
    month: new Date(new Date().getFullYear(), new Date().getMonth() + index + 1).toLocaleDateString("en-US", { month: "short" }),
    earnings,
    confidence: 85 + Math.random() * 10,
  })), [partner.forecastedEarnings]);

  const performanceMetrics = [
    { metric: "Trip Volume", value: Math.min(partner.tripVolume / 10, 100) },
    { metric: "On-Time Rate", value: partner.onTimePickupRate * 100 },
    { metric: "Vehicle Condition", value: partner.vehicleCondition },
    { metric: "Customer Rating", value: partner.avgRating * 20 },
  ];

  const radarData = [
    { subject: "Reliability", A: partner.onTimePickupRate * 100, fullMark: 100 },
    { subject: "Earnings", A: Math.min(avgEarnings / 50, 100), fullMark: 100 },
    { subject: "Customer Satisfaction", A: partner.avgRating * 20, fullMark: 100 },
    { subject: "Vehicle Quality", A: partner.vehicleCondition, fullMark: 100 },
    { subject: "Trip Volume", A: Math.min(partner.tripVolume / 10, 100), fullMark: 100 },
    { subject: "Health Stability", A: Math.max(100 - partner.leavesTaken * 10, 0), fullMark: 100 },
  ];

  const getSentimentBreakdown = (partnerId: string) => {
    const partnerReviews = reviews.filter(r => r.partnerId === partnerId);
    if (partnerReviews.length === 0) {
      return { positive: 0, neutral: 100, negative: 0 }; // Default to neutral if no reviews
    }

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    partnerReviews.forEach(review => {
      const sentimentScore = review.sentimentScore ?? analyzeReviewSentiment(review.comment);
      if (sentimentScore > 3.5) {
        positiveCount++;
      } else if (sentimentScore < 1.5) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });

    const total = partnerReviews.length;
    return {
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100),
    };
  };

  const sentimentBreakdown = getSentimentBreakdown(partner.id);

  const getRiskLevel = (score: number) => {
    if (score >= 800) return { level: "Low", textColor: "text-green-700" };
    if (score >= 700) return { level: "Medium", textColor: "text-yellow-700" };
    if (score >= 600) return { level: "High", textColor: "text-orange-700" };
    return { level: "Critical", textColor: "text-red-700" };
  };

  const risk = getRiskLevel(partner.novaScore);

  const chartConfig = {
    score: { label: "Nova Score", color: "#8884d8" },
    earnings: { label: "Earnings", color: "#82ca9d" },
    radar: { label: "Performance", color: "#ffc658" },
  };

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
                    {partner.name.split(" ").map((n) => n[0]).join("")}
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Nova Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{partner.novaScore}</div>
                  <p className="text-xs text-muted-foreground mt-1">Overall performance index</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={partner.riskLevel === "low" ? "default" : partner.riskLevel === "medium" ? "secondary" : "destructive"}>
                    {partner.riskLevel.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Current risk assessment</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{partner.avgRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{partner.totalTrips}</div>
                  <p className="text-xs text-muted-foreground mt-1">Lifetime completed trips</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>Key performance indicators at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]" key={`radar-chart-${partner.id}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} width={730} height={250} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={partner.name} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Tooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
                <CardDescription>Nova Score trends over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]" key={`historical-chart-${partner.id}`}>
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
                <ChartContainer config={chartConfig} className="h-[400px]" key={`forecast-chart-${partner.id}`}>
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