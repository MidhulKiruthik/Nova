"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { PartnerProfileView } from "@/components/partner-profile-view";
import { FairnessDashboard } from "@/components/fairness-dashboard";
import { ForecastCharts } from "@/components/forecast-charts";
import { DataManagementPage } from "@/components/data-management-page";
import { PartnersOverview } from "@/components/partners-overview";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { useDataStore } from "@/hooks/use-data-store";
import { Home, Users, BarChart, Shield, TrendingUp, MessageSquare, Settings, FileSpreadsheet } from "lucide-react";
import Image from "next/image";
import type { Partner } from "@/lib/interfaces";
import { PartnerSentimentList } from "@/components/partner-sentiment-list"; // Import the new component

export default function Page() {
  const { partners, fairnessMetrics } = useDataStore();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [activeView, setActiveView] = useState<string>("data-management"); // Default to Data Management view

  const handlePartnerSelect = (partner: Partner) => {
    setSelectedPartner(partner);
    setActiveView("partner-profile");
  };

  const handleBackToPartners = () => {
    setSelectedPartner(null);
    setActiveView("partners");
  };

  if (selectedPartner && activeView === "partner-profile") { // Only show profile view if a partner is selected AND activeView is 'partner-profile'
    return <PartnerProfileView partner={selectedPartner} onBack={handleBackToPartners} />;
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
              <SidebarMenuButton isActive={activeView === "data-management"} onClick={() => setActiveView("data-management")}>
                <FileSpreadsheet />
                <span>Data Management</span>
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
              {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace(/-/g, ' ')}
            </h1>
            <div>{/* User profile or other header elements */}</div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          {activeView === "partners" && (
            <PartnersOverview onPartnerSelect={handlePartnerSelect} />
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
              <ForecastCharts />
            </div>
          )}
          {activeView === "sentiment" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Sentiment Overview</h2>
              <PartnerSentimentList /> {/* Render the new component */}
            </div>
          )}
          {activeView === "data-management" && (
            <DataManagementPage />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}