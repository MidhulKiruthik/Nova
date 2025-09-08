"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dialog"
import type { Partner } from "@/lib/interfaces"
import { toast } from "sonner"
import { Edit } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface EditPartnerDialogProps {
  partner: Partner | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPartnerUpdated: (updatedPartner: Partner) => void
}

export function EditPartnerDialog({ partner, isOpen, onOpenChange, onPartnerUpdated }: EditPartnerDialogProps) {
  const [editingPartner, setEditingPartner] = useState<Partner | null>(partner)

  useEffect(() => {
    if (partner) {
      // Ensure earningsHistory and forecastedEarnings match the new expected lengths
      const updatedEarningsHistory = [...(partner.earningsHistory || [])];
      while (updatedEarningsHistory.length < 8) updatedEarningsHistory.push(0);
      const updatedForecastedEarnings = [...(partner.forecastedEarnings || [])];
      while (updatedForecastedEarnings.length < 4) updatedForecastedEarnings.push(0);

      setEditingPartner({
        ...partner,
        earningsHistory: updatedEarningsHistory,
        forecastedEarnings: updatedForecastedEarnings,
      });
    }
  }, [partner])

  const handleEditPartner = () => {
    if (!editingPartner) return

    if (!editingPartner.name || !editingPartner.email || !editingPartner.ageGroup || !editingPartner.gender || !editingPartner.ethnicity || !editingPartner.areaType) {
      toast.error("Name, Email, Age Group, Gender, Ethnicity, and Area Type are required to update a partner.")
      return
    }

    onPartnerUpdated(editingPartner)
    onOpenChange(false)
    toast.success("Partner updated successfully!")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Partner</DialogTitle>
          <DialogDescription>Update partner information</DialogDescription>
        </DialogHeader>
        {editingPartner && (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
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
                  <Label htmlFor="edit-novaScore">Nova Score</Label>
                  <Input
                    id="edit-novaScore"
                    type="number"
                    value={editingPartner.novaScore}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, novaScore: Number.parseInt(e.target.value) || 0 })
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
            </TabsContent>
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tripVolume">Trip Volume</Label>
                  <Input
                    id="edit-tripVolume"
                    type="number"
                    value={editingPartner.tripVolume}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, tripVolume: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-onTimeRate">On-Time Rate</Label>
                  <Input
                    id="edit-onTimeRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editingPartner.onTimePickupRate}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, onTimePickupRate: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-totalTrips">Total Trips</Label>
                  <Input
                    id="edit-totalTrips"
                    type="number"
                    value={editingPartner.totalTrips}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, totalTrips: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-avgRating">Average Rating</Label>
                  <Input
                    id="edit-avgRating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editingPartner.avgRating}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, avgRating: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cancellationRate">Cancellation Rate</Label>
                  <Input
                    id="edit-cancellationRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editingPartner.cancellationRate}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, cancellationRate: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-vehicleCondition">Vehicle Condition</Label>
                  <Input
                    id="edit-vehicleCondition"
                    type="number"
                    min="0"
                    max="100"
                    value={editingPartner.vehicleCondition}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, vehicleCondition: Number.parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="demographics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ageGroup">Age Group</Label>
                  <Input
                    id="edit-ageGroup"
                    value={editingPartner.ageGroup}
                    onChange={(e) => setEditingPartner({ ...editingPartner, ageGroup: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select
                    value={editingPartner.gender}
                    onValueChange={(value) => setEditingPartner({ ...editingPartner, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-ethnicity">Ethnicity</Label>
                  <Input
                    id="edit-ethnicity"
                    value={editingPartner.ethnicity}
                    onChange={(e) => setEditingPartner({ ...editingPartner, ethnicity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-areaType">Area Type</Label>
                  <Select
                    value={editingPartner.areaType}
                    onValueChange={(value) => setEditingPartner({ ...editingPartner, areaType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="suburban">Suburban</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-rawReviewsText">Raw Reviews (semicolon-separated)</Label>
                  <Input
                    id="edit-rawReviewsText"
                    value={editingPartner.rawReviewsText}
                    onChange={(e) => setEditingPartner({ ...editingPartner, rawReviewsText: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-overallSentimentScore">Overall Sentiment Score (0-5)</Label>
                  <Input
                    id="edit-overallSentimentScore"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editingPartner.overallSentimentScore || ""}
                    onChange={(e) =>
                      setEditingPartner({ ...editingPartner, overallSentimentScore: Number.parseFloat(e.target.value) || undefined })
                    }
                    placeholder="e.g., 4.2"
                  />
                </div>
              </div>
            </TabsContent>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPartner}>Save Changes</Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}