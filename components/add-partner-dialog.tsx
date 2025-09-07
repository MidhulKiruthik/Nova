"use client"

import { useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import type { Partner } from "@/lib/interfaces"
import { toast } from "sonner"

interface AddPartnerDialogProps {
  onPartnerAdded: (partner: Partner) => void
}

export function AddPartnerDialog({ onPartnerAdded }: AddPartnerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({
    name: "",
    email: "",
    phone: "",
    novaScore: 0,
    tripVolume: 0,
    onTimePickupRate: 0,
    leavesTaken: 0,
    medicalStability: "stable",
    vehicleCondition: 0,
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
      novaScore: newPartner.novaScore || 0,
      earningsHistory: [0, 0, 0, 0, 0, 0], // Default empty earnings history
      tripVolume: newPartner.tripVolume || 0,
      onTimePickupRate: newPartner.onTimePickupRate || 0,
      leavesTaken: newPartner.leavesTaken || 0,
      medicalStability: newPartner.medicalStability || "stable",
      vehicleCondition: newPartner.vehicleCondition || 0,
      forecastedEarnings: [0, 0, 0, 0, 0], // Default empty forecasted earnings
      riskLevel: newPartner.riskLevel || "medium",
      joinDate: new Date().toISOString().split("T")[0],
      lastActive: new Date().toISOString().split("T")[0],
      totalTrips: newPartner.totalTrips || 0,
      avgRating: newPartner.avgRating || 0,
      cancellationRate: newPartner.cancellationRate || 0,
    }

    onPartnerAdded(partner)
    setNewPartner({}) // Reset form
    setIsOpen(false)
    toast.success("Partner added successfully!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <Label htmlFor="novaScore">Nova Score</Label>
                <Input
                  id="novaScore"
                  type="number"
                  value={newPartner.novaScore || ""}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, novaScore: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="Enter Nova score"
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddPartner}>Add Partner</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}