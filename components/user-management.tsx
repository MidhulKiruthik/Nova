"use client"
import { ExcelImport } from "./excel-import"
import { ExportManager } from "./export-manager"

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
import type { Partner } from "@/lib/mock-data"
import { useDataStore } from "@/hooks/use-data-store"
import { toast } from "sonner" // Import sonner toast

interface UserManagementProps {
  partners: Partner[]
  onPartnersUpdate: (partners: Partner[]) => void
}

export function UserManagement({ partners, onPartnersUpdate }: UserManagementProps) {
  const { addPartner, updatePartner, deletePartner, setPartners } = useDataStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({
    name: "",
    email: "",
    phone: "",
    mlScore: 0, // Changed from novaScore
    tripVolume: 0,
    onTimePickupRate: 0,
    leavesTaken: 0,
    medicalStability: "stable",
    vehicleCondition: 0,
    // sentimentScore: 0, // Removed
    riskLevel: "medium",
    totalTrips: 0,
    avgRating: 0,
    cancellationRate: 0,
  })

  const handleAddPartner = () => {
    if (!newPartner.name || !newPartner.email) {
      toast.error("Name and Email are required to add a partner.")
      return
    }

    const partner: Partner = {
      id: `p${Date.now()}`,
      name: newPartner.name || "",
      email: newPartner.email || "",
      phone: newPartner.phone || "",
      mlScore: newPartner.mlScore || 0, // Changed from novaScore
      earningsHistory: [0, 0, 0, 0, 0, 0],
      tripVolume: newPartner.tripVolume || 0,
      onTimePickupRate: newPartner.onTimePickupRate || 0,
      leavesTaken: newPartner.leavesTaken || 0,
      medicalStability: newPartner.medicalStability || "stable",
      vehicleCondition: newPartner.vehicleCondition || 0,
      // customerReviews: [], // Removed
      // sentimentScore: newPartner.sentimentScore || 0, // Removed
      forecastedEarnings: [0, 0, 0, 0, 0],
      riskLevel: newPartner.riskLevel || "medium",
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: new Date().toISOString().split("T")[0],
      totalTrips: newPartner.totalTrips || 0,
      avgRating: newPartner.avgRating || 0,
      cancellationRate: newPartner.cancellationRate || 0,
    }

    addPartner(partner)
    onPartnersUpdate([...partners, partner])
    setNewPartner({})
    setIsAddDialogOpen(false)
    toast.success("Partner added successfully!")
  }

  const handleEditPartner = () => {
    if (!editingPartner) return

    updatePartner(editingPartner.id, editingPartner)
    const updatedPartners = partners.map((p) => (p.id === editingPartner.id ? editingPartner : p))
    onPartnersUpdate(updatedPartners)
    setEditingPartner(null)
    setIsEditDialogOpen(false)
    toast.success("Partner updated successfully!")
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
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
                      <th className="text-left p-3 font-medium">ML Score</th> {/* Changed from Nova Score */}
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
                              partner.mlScore >= 700 // Changed from novaScore
                                ? "default"
                                : partner.mlScore >= 600 // Changed from novaScore
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {partner.mlScore} {/* Changed from novaScore */}
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
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Partner</DialogTitle>
                <DialogDescription>Update partner information</DialogDescription>
              </DialogHeader>
              {editingPartner && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        value={editingPartner.name}
                        onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        value={editingPartner.email}
                        onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-mlScore">ML Score</Label> {/* Changed from novaScore */}
                      <Input
                        id="edit-mlScore"
                        type="number"
                        value={editingPartner.mlScore} // Changed from novaScore
                        onChange={(e) =>
                          setEditingPartner({ ...editingPartner, mlScore: Number.parseInt(e.target.value) || 0 }) // Changed from novaScore
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-riskLevel">Risk Level</Label>
                      <Select
                        value={editingPartner.riskLevel}
                        onValueChange={(value) => setEditingPartner({ ...editingPartner, riskLevel: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditPartner}>Save Changes</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add Partner Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Partner</DialogTitle>
                <DialogDescription>Enter partner information to add them to the system</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newPartner.name || ""}
                        onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newPartner.email || ""}
                        onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newPartner.phone || ""}
                        onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mlScore">ML Score</Label> {/* Changed from novaScore */}
                      <Input
                        id="mlScore"
                        type="number"
                        value={newPartner.mlScore || ""} // Changed from novaScore
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, mlScore: Number.parseInt(e.target.value) || 0 }) // Changed from novaScore
                        }
                        placeholder="Enter ML score"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="performance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tripVolume">Trip Volume</Label>
                      <Input
                        id="tripVolume"
                        type="number"
                        value={newPartner.tripVolume || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, tripVolume: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Monthly trip volume"
                      />
                    </div>
                    <div>
                      <Label htmlFor="onTimeRate">On-Time Rate</Label>
                      <Input
                        id="onTimeRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newPartner.onTimePickupRate || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, onTimePickupRate: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00 - 1.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalTrips">Total Trips</Label>
                      <Input
                        id="totalTrips"
                        type="number"
                        value={newPartner.totalTrips || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, totalTrips: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Total completed trips"
                      />
                    </div>
                    <div>
                      <Label htmlFor="avgRating">Average Rating</Label>
                      <Input
                        id="avgRating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={newPartner.avgRating || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, avgRating: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.0 - 5.0"
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="risk" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="riskLevel">Risk Level</Label>
                      <Select
                        value={newPartner.riskLevel || "medium"}
                        onValueChange={(value) => setNewPartner({ ...newPartner, riskLevel: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="medicalStability">Medical Stability</Label>
                      <Select
                        value={newPartner.medicalStability || "stable"}
                        onValueChange={(value) => setNewPartner({ ...newPartner, medicalStability: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select medical stability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="concerning">Concerning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicleCondition">Vehicle Condition</Label>
                      <Input
                        id="vehicleCondition"
                        type="number"
                        min="0"
                        max="100"
                        value={newPartner.vehicleCondition || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, vehicleCondition: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="0-100 score"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cancellationRate">Cancellation Rate</Label>
                      <Input
                        id="cancellationRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newPartner.cancellationRate || ""}
                        onChange={(e) =>
                          setNewPartner({ ...newPartner, cancellationRate: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0.00 - 1.00"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPartner}>Add Partner</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}