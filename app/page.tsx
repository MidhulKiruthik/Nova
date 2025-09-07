"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { PartnerDataTable } from "@/components/partner-data-table";
import { PartnerProfileView } from "@/components/partner-profile-view";
import { FairnessDashboard } from "@/components/fairness-dashboard";
import { ForecastCharts } from "@/components/forecast-charts";
import { SentimentHeatmap } from "@/components/sentiment-heatmap";
import { UserManagement } from "@/components/user-management";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { useDataStore } from "@/hooks/use-data-store";
import { mockPartners } from "@/lib/mock-partners"; // Updated import
import { mockReviews } from "@/lib/mock-reviews"; // Updated import
import { mockFairnessMetrics } from "@/lib/mock-fairness-data"; // Updated import
import { Home, Users, BarChart, Shield, TrendingUp, MessageSquare, Settings } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const { partners, fairnessMetrics, initializeWithMockData, setPartners, reviews } = useDataStore(); // Added reviews to destructuring
  const [selectedPartner, setSelectedPartner] = useState<typeof partners[0] | null>(null);
  const [activeView, setActiveView] = useState<string>("dashboard");

  useEffect(() => {
    // Initialize data store with mock data if it's empty
    if (partners.length === 0) {
      initializeWithMockData(mockPartners, mockReviews, mockFairnessMetrics);
    }
  }, [partners.length, initializeWithMockData, mockPartners, mockReviews, mockFairnessMetrics]); // Added mock data to dependencies

  const handlePartnerSelect = (partner: typeof partners[0]) => {
    setSelectedPartner(partner);
    setActiveView("partner-profile");
  };

  const handleBackToDashboard = () => {
    setSelectedPartner(null);
    setActiveView("dashboard");
  };

  const handlePartnersUpdate = (updatedPartners: typeof partners) => {
    setPartners(updatedPartners);
  };

  if (selectedPartner) {
    return <PartnerProfileView partner={selectedPartner} onBack={handleBackToDashboard} />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-center p-2">
            <Image src="/placeholder-logo.svg" alt="Nova+" width={32} height={32} className="mr-2" />
            <span className="text-lg font-bold text-foreground">Nova+</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "partners"} onClick={() => setActiveView("partners")}>
                <Users />
                <span>Partners</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "fairness"} onClick={() => setActiveView("fairness")}>
                <Shield />
                <span>Fairness</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "forecast"} onClick={() => setActiveView("forecast")}>
                <TrendingUp />
                <span>Forecast</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "sentiment"} onClick={() => setActiveView("sentiment")}>
                <MessageSquare />
                <span>Sentiment</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeView === "management"} onClick={() => setActiveView("management")}>
                <Settings />
                <span>Management</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-2 border-t border-border">
          <SyncStatusIndicator />
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <SidebarTrigger />
            <h1 className="text-xl font-bold text-foreground">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h1>
            <div>{/* User profile or other header elements */}</div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          {activeView === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              {/* Placeholder for dashboard content */}
              <p className="text-muted-foreground">Welcome to your Nova+ Dashboard. Select a view from the sidebar.</p>
              <PartnerDataTable partners={partners} />
            </div>
          )}
          {activeView === "partners" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">All Partners</h2>
              <PartnerDataTable partners={partners} onPartnerSelect={handlePartnerSelect} />
            </div>
          )}
          {activeView === "fairness" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Fairness Analysis</h2>
              <FairnessDashboard fairnessMetrics={fairnessMetrics} />
            </div>
          )}
          {activeView === "forecast" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Forecast & Predictions</h2>
              <ForecastCharts partners={partners} />
            </div>
          )}
          {activeView === "sentiment" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Sentiment Heatmap</h2>
              <SentimentHeatmap partners={partners} />
            </div>
          )}
          {activeView === "management" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              <UserManagement partners={partners} onPartnersUpdate={handlePartnersUpdate} />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}