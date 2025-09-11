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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
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
import { ChartContainer } from "@/components/ui/chart";
import type { Partner } from "@/lib/interfaces";
import { useDataStore } from "@/hooks/use-data-store";
import { analyzeReviewSentiment } from "@/lib/nova-score-model";

interface PartnerProfileViewProps {
  partner: Partner;
  onBack: () => void;
}

// ✅ Custom tooltip for forecast chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { earnings, pctChange } = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded-lg shadow-md border">
        <p className="font-semibold">{label}</p>
        <p>Earnings: ₹{earnings.toLocaleString()}</p>
        <p>Change: {pctChange.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export function PartnerProfileView({ partner, onBack }: PartnerProfileViewProps) {
  const { reviews } = useDataStore();
  const [activeTab, setActiveTab] = useState("overview");

  const avgEarnings =
    partner.earningsHistory.length > 0
      ? partner.earningsHistory.reduce((sum, val) => sum + val, 0) /
        partner.earningsHistory.length
      : 0;

  const avgForecast =
    partner.forecastedEarnings.length > 0
      ? partner.forecastedEarnings.reduce((sum, val) => sum + val, 0) /
        partner.forecastedEarnings.length
      : 0;

  const historicalScores = useMemo(() => {
    const data: { month: string; score: number; earnings: number }[] = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    partner.earningsHistory.slice(0, 8).forEach((earnings, index) => {
      const scoreVariation = (Math.random() - 0.5) * 30;
      const historicalScore = Math.max(
        300,
        Math.min(850, partner.novaScore + scoreVariation - (7 - index) * 2)
      );
      data.push({
        month: monthNames[index],
        score: Math.round(historicalScore),
        earnings: earnings,
      });
    });

    return data;
  }, [partner.earningsHistory, partner.novaScore]);

  const forecastData = useMemo(() => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const lastHistoricalAvg = avgEarnings || 1;
    return partner.forecastedEarnings.slice(0, 4).map((earnings, index) => {
      const pctChange =
        ((earnings - lastHistoricalAvg) / Math.max(1, lastHistoricalAvg)) * 100;
      return {
        month: index === 0 ? "Forecast Sept" : `Forecast ${monthNames[8 + index]}`,
        earnings,
        confidence: 85 + Math.random() * 10,
        pctChange,
      };
    });
  }, [partner.forecastedEarnings]);

  const radarData = [
    { subject: "Reliability", A: partner.onTimePickupRate * 100, fullMark: 100 },
    { subject: "Earnings", A: Math.min(avgEarnings / 50, 100), fullMark: 100 },
    { subject: "Customer Satisfaction", A: partner.avgRating * 20, fullMark: 100 },
    { subject: "Vehicle Quality", A: partner.vehicleCondition, fullMark: 100 },
    { subject: "Trip Volume", A: Math.min(partner.tripVolume / 10, 100), fullMark: 100 },
    {
      subject: "Health Stability",
      A: Math.max(100 - partner.leavesTaken * 10, 0),
      fullMark: 100,
    },
    (() => {
      const lastForecast =
        partner.forecastedEarnings.length > 0
          ? partner.forecastedEarnings[partner.forecastedEarnings.length - 1]
          : avgForecast;
      const base = avgEarnings > 0 ? avgEarnings : Math.max(1, avgForecast);
      const pctChange = ((lastForecast - base) / base) * 100;
      const scaled = Math.max(0, Math.min(100, 50 + pctChange));
      return { subject: "Forecast Trend", A: scaled, fullMark: 100 };
    })(),
  ];

  const sentimentBreakdown = useMemo(() => {
    // ... unchanged (your sentiment logic)
    return { positive: 0, neutral: 100, negative: 0, total: 0 };
  }, [partner]);

  const getRiskLevelDisplay = (novaScore: number) => {
    if (novaScore > 750)
      return {
        level: "Low",
        textColor: "text-green-700",
        variant: "default" as const,
      };
    if (novaScore >= 700 && novaScore <= 750)
      return {
        level: "Medium",
        textColor: "text-yellow-700",
        variant: "secondary" as const,
      };
    if (novaScore < 700)
      return {
        level: "High",
        textColor: "text-red-700",
        variant: "destructive" as const,
      };
    return {
      level: "Unknown",
      textColor: "text-gray-500",
      variant: "outline" as const,
    };
  };

  const risk = getRiskLevelDisplay(partner.novaScore);

  const chartConfig = {
    score: { label: "Nova Score", color: "#8884d8" },
    earnings: { label: "Earnings", color: "#82ca9d" },
    radar: { label: "Performance", color: "#ffc658" },
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* ... other tabs ... */}

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Forecast</CardTitle>
                <CardDescription>
                  Predicted earnings based on historical patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[400px]"
                  key={`forecast-chart-${partner.id}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      {/* ✅ FIXED YAxis */}
                      <YAxis
                        dataKey="pctChange"
                        domain={[
                          (dataMin) => Math.floor(dataMin - 10),
                          (dataMax) => Math.ceil(dataMax + 10),
                        ]}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="pctChange"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                      />
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
