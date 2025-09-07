"use client"
import { ExcelImport } from "./excel-import"
import { ExportManager } from "./export-manager"
import { AddPartnerDialog } from "./add-partner-dialog"
import { EditPartnerDialog } from "./edit-partner-dialog"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import type { Partner } from "@/lib/interfaces"
import { useDataStore } from "@/hooks/use-data-store"
import { toast } from "sonner"

interface UserManagementProps {
  partners: Partner[]
  onPartnersUpdate: (partners: Partner[]) => void
}

export function UserManagement({ partners, onPartnersUpdate }: UserManagementProps) {
  const { addPartner, updatePartner, deletePartner, setPartners } = useDataStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)

  const handleAddPartner = (partner: Partner) => {
    addPartner(partner)
    onPartnersUpdate([...partners, partner])
  }

  const handleUpdatePartner = (updatedPartner: Partner) => {
    updatePartner(updatedPartner.id, updatedPartner)
    const updatedPartners = partners.map((p) => (p.id === updatedPartner.id ? updatedPartner : p))
    onPartnersUpdate(updatedPartners)
  }

  const handleDeletePartner = (partnerId: string) => {
    if (confirm("Are you sure you want to delete this partner?")) {
      deletePartner(partnerId)
      const updatedPartners = partners.filter((p) => p.id !== partnerId)
      onPartnersUpdate(updatedPartners)
      toast.info("Partner deleted.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Excel Import Component */}
      <ExcelImport
        onImportComplete={(importedPartners) => {
          setPartners(importedPartners)
          onPartnersUpdate(importedPartners)
          toast.success(`${importedPartners.length} partners imported successfully!`)
        }}
        onImportError={(error) => {
          toast.error(`Import failed: ${error}`)
        }}
      />

      <ExportManager
        partners={partners}
        fairnessMetrics={[]} // Pass actual fairness metrics from props if available
      />

      {/* Existing User Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage partners, import/export data, and maintain user records</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AddPartnerDialog onPartnerAdded={handleAddPartner} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{partners.length}</div>
                  <p className="text-xs text-muted-foreground">Total Partners</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-chart-2">
                    {partners.filter((p) => p.riskLevel === "low").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Low Risk Partners</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-destructive">
                    {partners.filter((p) => p.riskLevel === "high").length}
                  </div>
                  <p className="text-xs text-muted-foreground">High Risk Partners</p>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Partner</th>
                      <th className="text-left p-3 font-medium">Nova Score</th>
                      <th className="text-left p-3 font-medium">Risk Level</th>
                      <th className="text-left p-3 font-medium">Total Trips</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-sm text-muted-foreground">{partner.email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              partner.novaScore >= 700
                                ? "default"
                                : partner.novaScore >= 600
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {partner.novaScore}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              partner.riskLevel === "low"
                                ? "default"
                                : partner.riskLevel === "medium"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {partner.riskLevel}
                          </Badge>
                        </td>
                        <td className="p-3">{partner.totalTrips}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPartner(partner)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePartner(partner.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit Partner Dialog */}
          <EditPartnerDialog
            partner={editingPartner}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onPartnerUpdated={handleUpdatePartner}
          />
        </CardContent>
      </Card>
    </div>
  )
}