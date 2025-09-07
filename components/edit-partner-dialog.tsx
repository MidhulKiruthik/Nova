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

interface EditPartnerDialogProps {
  partner: Partner | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPartnerUpdated: (updatedPartner: Partner) => void
}

export function EditPartnerDialog({ partner, isOpen, onOpenChange, onPartnerUpdated }: EditPartnerDialogProps) {
  const [editingPartner, setEditingPartner] = useState<Partner | null>(partner)

  useEffect(() => {
    setEditingPartner(partner)
  }, [partner])

  const handleEditPartner = () => {
    if (!editingPartner) return

    if (!editingPartner.name || !editingPartner.email) {
      toast.error("Name and Email are required to update a partner.")
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
              {/* Add other editable fields here if needed */}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPartner}>Save Changes</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}