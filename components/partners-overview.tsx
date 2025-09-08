"use client"

import { useState } from "react"
import { PartnerDataTable } from "@/components/partner-data-table"
import { AddPartnerDialog } from "@/components/add-partner-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { useDataStore } from "@/hooks/use-data-store"
import type { Partner } from "@/lib/interfaces"
import { toast } from "sonner"

interface PartnersOverviewProps {
  onPartnerSelect: (partner: Partner) => void
}

export function PartnersOverview({ onPartnerSelect }: PartnersOverviewProps) {
  const { partners, addPartner } = useDataStore()

  const handleAddPartner = (partner: Partner) => {
    addPartner(partner)
    toast.success("Partner added successfully!")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Partners
              </CardTitle>
              <CardDescription>
                Comprehensive view of all gig economy partners with Nova scores and performance metrics
              </CardDescription>
            </div>
            <AddPartnerDialog onPartnerAdded={handleAddPartner} />
          </div>
        </CardHeader>
        <CardContent>
          <PartnerDataTable partners={partners} onPartnerSelect={onPartnerSelect} />
        </CardContent>
      </Card>
    </div>
  )
}