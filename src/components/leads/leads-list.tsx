"use client";

import { useState } from "react";
import { Pencil, Trash2, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadDialog } from "./lead-dialog";
import { useApiMutation } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Lead {
  id: number;
  leadId: string;
  propertyAddress: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  status: string;
  arv: string | null;
  repairCost: string | null;
  createdAt: string;
}

interface LeadsListProps {
  leads: Lead[];
  isLoading: boolean;
  onRefetch: () => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  unqualified: "bg-red-500",
  closed: "bg-gray-500",
};

export function LeadsList({ leads, isLoading, onRefetch }: LeadsListProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  const deleteMutation = useApiMutation(
    (id: number) => fetch(`/api/leads/${id}`, { method: "DELETE" }).then(r => r.ok ? r : Promise.reject(r)),
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Lead deleted successfully",
        });
        onRefetch();
        setDeletingLead(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete lead",
          variant: "destructive",
        });
      },
    }
  );

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No leads found. Create your first lead to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead ID</TableHead>
              <TableHead>Property Address</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ARV</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.leadId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {lead.propertyAddress}
                  </div>
                </TableCell>
                <TableCell>{lead.ownerName || "—"}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {lead.ownerPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.ownerPhone}
                      </div>
                    )}
                    {lead.ownerEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.ownerEmail}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${statusColors[lead.status]} text-white`}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.arv ? `$${Number(lead.arv).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLead(lead)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingLead(lead)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingLead && (
        <LeadDialog
          open={!!editingLead}
          onOpenChange={(open: boolean) => !open && setEditingLead(null)}
          lead={editingLead}
          onSuccess={() => {
            onRefetch();
            setEditingLead(null);
          }}
        />
      )}

      <AlertDialog
        open={!!deletingLead}
        onOpenChange={(open: boolean) => !open && setDeletingLead(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLead && deleteMutation.mutate(deletingLead.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
