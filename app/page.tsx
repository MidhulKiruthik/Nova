"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PartnerDataTable } from "@/components/partner-data-table"
import { SentimentHeatmap } from "@/components/sentiment-heatmap"
import { ForecastCharts } from "@/components/forecast-charts"
import { FairnessDashboard } from "@/components/fairness-dashboard"
import { UserManagement } from "@/components/user-management"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import {
  mockPartners,
  mockFairnessMetrics,
  calculateSentimentDistribution,
  getScoreDistribution,
  getRiskDistribution,
} from "@/lib/mock-data"
import { useState, useEffect } from "react"
import type { Partner } from "@/lib/mock-data"
import { dataStore } from "@/lib/data-store"

export default function NovaPage() {
  const [partners, setPartners] = useState<Partner[]>(mockPartners)

  useEffect(() => {
    const storedPartners = dataStore.getPartners()
    if (storedPartners.length === 0) {
      dataStore.initializeWithMockData(mockPartners, [], mockFairnessMetrics)
    }
    setPartners(dataStore.getPartners())
  }, [])

  const sentimentData = calculateSentimentDistribution(partners)
  const scoreData = getScoreDistribution(partners)
  const riskData = getRiskDistribution(partners)

  const handlePartnersUpdate = (updatedPartners: Partner[]) => {
    setPartners(updatedPartners)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">N+</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Nova+</h1>
              <Badge variant="secondary" className="ml-2">
                Credit Scoring Platform
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <SyncStatusIndicator />
              <span className="text-sm text-muted-foreground">Risk Team Dashboard</span>
              <div className="w-8 h-8 bg-muted rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{partners.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active gig workers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Nova Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(partners.reduce((sum, p) => sum + p.novaScore, 0) / partners.length)}
              </div>
              <p className="text-xs text-accent mt-1">+12 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{riskData.high}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Positive Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">{sentimentData.positive}</div>
              <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <div className="mb-8">
          <UserManagement partners={partners} onPartnersUpdate={handlePartnersUpdate} />
        </div>

        {/* Fairness Dashboard */}
        <div className="mb-8">
          <FairnessDashboard fairnessMetrics={mockFairnessMetrics} />
        </div>

        {/* Nova Score Forecast Charts */}
        <div className="mb-8">
          <ForecastCharts partners={partners} />
        </div>

        {/* Sentiment Heatmap */}
        <div className="mb-8">
          <SentimentHeatmap partners={partners} />
        </div>

        {/* Comprehensive Partner Data Table */}
        <div className="mb-8">
          <PartnerDataTable partners={partners} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Nova Score ranges across all partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Excellent (800+)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-2 rounded-full"
                        style={{ width: `${(scoreData.excellent / partners.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{scoreData.excellent}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Good (700-799)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(scoreData.good / partners.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{scoreData.good}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fair (600-699)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(scoreData.fair / partners.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{scoreData.fair}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Poor (&lt;600)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive rounded-full"
                        style={{ width: `${(scoreData.poor / partners.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{scoreData.poor}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
