"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Alert, AlertDescription, AlertTitle
} from "@/components/ui/alert"
import { ChartContainer } from "@/components/ui/chart"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { AlertTriangle, CheckCircle, TrendingUp, Users, Shield, Eye } from "lucide-react"
import type { FairnessMetric } from "@/lib/interfaces"

interface FairnessDashboardProps {
  fairnessMetrics: FairnessMetric[]
}

export function FairnessDashboard({ fairnessMetrics }: FairnessDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Use the dynamically generated fairnessMetrics directly
  const validFairnessMetrics =
    fairnessMetrics?.filter(
      (metric) =>
        metric &&
        typeof metric.demographic === "string" &&
        metric.demographic.trim().length > 0 &&
        typeof metric.averageScore === "number" &&
        typeof metric.bias === "number" &&
        !isNaN(metric.averageScore) &&
        !isNaN(metric.bias) &&
        isFinite(metric.averageScore) &&
        isFinite(metric.bias),
    ) || []

  // Calculate overall fairness score based on valid metrics
  const overallFairnessScore =
    validFairnessMetrics.length > 0
      ? Math.round(
          (1 -
            Math.abs(
              validFairnessMetrics.reduce((sum, m) => sum + Math.abs(m.bias), 0) /
                validFairnessMetrics.length,
            )) *
            100,
        )
      : 0

  // Identify bias alerts based on valid metrics
  const biasAlerts = validFairnessMetrics.filter((m) => Math.abs(m.bias) > 0.05)
  const criticalAlerts = validFairnessMetrics.filter((m) => Math.abs(m.bias) > 0.1)

  const radarData = useMemo(() => {
    // Map all valid fairness metrics directly to radar chart data
    return validFairnessMetrics.map(metric => {
      // Scale the fairness score for visual emphasis on the radar chart
      const fairnessScore = Math.max(0, Math.min(100, Math.round((1 - Math.abs(metric.bias) * 2) * 100)));
      return {
        demographic: metric.group, // Use the specific group name for the axis
        fairnessScore,
      };
    });
  }, [validFairnessMetrics]);

  // Demographic comparison data based on valid metrics
  const demographicComparison = validFairnessMetrics.map((metric) => ({
    demographic: metric.demographic,
    averageScore: metric.averageScore,
    bias: metric.bias * 100, // Convert to percentage for display
    count: metric.count,
    fairnessLevel:
      Math.abs(metric.bias) < 0.02
        ? "Excellent"
        : Math.abs(metric.bias) < 0.05
          ? "Good"
          : Math.abs(metric.bias) < 0.1
            ? "Needs Attention"
            : "Critical",
  }))

  const getBiasColor = (bias: number) => {
    const absBias = Math.abs(bias)
    if (absBias < 0.02) return "text-chart-2"
    if (absBias < 0.05) return "text-accent"
    if (absBias < 0.1) return "text-orange-500"
    return "text-destructive"
  }

  const chartConfig = {
    fairnessScore: {
      label: "Fairness Score",
      color: "var(--chart-2)",
    },
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Fairness Dashboard</CardTitle>
                <CardDescription>Bias detection and fairness monitoring across demographic groups</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Overall Fairness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{overallFairnessScore}%</div>
            <p className="text-xs text-chart-2 mt-1">Based on current data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Bias Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{biasAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{criticalAlerts.length} critical</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Demographics Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{validFairnessMetrics.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active groups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Improvement Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">N/A</div> {/* No historical trend data from Excel */}
            <p className="text-xs text-muted-foreground mt-1">Requires historical data</p>
          </CardContent>
        </Card>
      </div>

      {/* Bias Alerts */}
      {biasAlerts.length > 0 && (
        <div className="space-y-3">
          {criticalAlerts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Bias Detected</AlertTitle>
              <AlertDescription>
                {criticalAlerts.length} demographic group(s) show significant bias (&gt;10%). Immediate review
                recommended.
              </AlertDescription>
            </Alert>
          )}
          {biasAlerts.length > criticalAlerts.length && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertTitle>Bias Monitoring</AlertTitle>
              <AlertDescription>
                {biasAlerts.length - criticalAlerts.length} demographic group(s) require attention for potential bias.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fairness Radar (All Demographic Groups)</CardTitle>
            <CardDescription>Fairness scores across all monitored demographic groups</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
            ) : radarData.length > 0 && radarData.length >= 3 ? (
              <ChartContainer config={chartConfig} className="h-[400px]" key={`radar-static`}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="demographic" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Fairness Score"
                      dataKey="fairnessScore"
                      stroke="var(--color-fairnessScore)"
                      fill="var(--color-fairnessScore)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      dot={false}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                {radarData.length === 0
                  ? "No fairness data available for any demographic groups."
                  : "Need at least 3 demographic groups with data for radar chart."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bias Trend Analysis</CardTitle>
            <CardDescription>Historical bias levels and improvement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No historical bias trend data available from Excel.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographic Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Demographic Group Analysis</CardTitle>
          <CardDescription>Detailed bias metrics and fairness assessment by demographic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demographicComparison.map((demo, index) => (
              <div key={demo.demographic} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{demo.demographic}</h4>
                      <p className="text-sm text-muted-foreground">{demo.count.toLocaleString()} partners</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      demo.fairnessLevel === "Excellent"
                        ? "default"
                        : demo.fairnessLevel === "Good"
                          ? "secondary"
                          : demo.fairnessLevel === "Needs Attention"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {demo.fairnessLevel}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Score</span>
                      <span className="text-sm font-medium">{demo.averageScore.toFixed(0)}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(demo.averageScore / 850) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Bias Level</span>
                      <span className={`text-sm font-medium ${getBiasColor(demo.bias / 100)}`}>
                        {demo.bias > 0 ? "+" : ""}
                        {demo.bias.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          Math.abs(demo.bias) < 2
                            ? "bg-chart-2"
                            : Math.abs(demo.bias) < 5
                              ? "bg-accent"
                              : Math.abs(demo.bias) < 10
                                ? "bg-orange-500"
                                : "bg-destructive"
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(demo.bias) * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fairness Score</span>
                      <span className="text-sm font-medium text-chart-2">
                        {Math.round((1 - Math.abs(demo.bias / 100)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-2 rounded-full"
                        style={{ width: `${(1 - Math.abs(demo.bias / 100)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}