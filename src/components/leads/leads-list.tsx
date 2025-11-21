"use client";

import { useMemo, useState } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/hooks/use-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "next-auth/react";
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
  onSortChange?: (column: string) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  unqualified: "bg-red-500",
  closed: "bg-gray-500",
};

export function LeadsList({ leads, isLoading, onRefetch, onSortChange }: LeadsListProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

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

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => apiGet<any[]>("/api/team"),
    staleTime: 60000,
  });

  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;
  const { data: myAssignments = [] } = useQuery({
    queryKey: ["lead-assignments", currentUserId, "assigned"],
    queryFn: () => currentUserId ? apiGet<any[]>(`/api/lead-assignments?userId=${currentUserId}&status=assigned`) : Promise.resolve([]),
    enabled: !!currentUserId,
    staleTime: 10000,
  });

  const assignmentsByLead: Record<number, any> = useMemo(() => {
    const map: Record<number, any> = {};
    for (const a of myAssignments) {
      map[a.leadId] = a;
    }
    return map;
  }, [myAssignments]);

  const assignMutation = useApiMutation(
    (payload: { leadId: number; assignedToUserId: number }) => apiPost<any>("/api/lead-assignments", payload),
    {
      onSuccess: () => {
        toast({ title: "Success", description: "Lead assigned" });
        queryClient.invalidateQueries({ queryKey: ["lead-assignments", currentUserId, "assigned"] });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to assign lead", variant: "destructive" });
      },
    }
  );

  const acceptMutation = useApiMutation(
    (assignmentId: number) => apiPut<any>(`/api/lead-assignments/${assignmentId}`, { status: "accepted" }),
    {
      onSuccess: () => {
        toast({ title: "Accepted", description: "Assignment accepted" });
        onRefetch();
        queryClient.invalidateQueries({ queryKey: ["lead-assignments", currentUserId, "assigned"] });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to accept assignment", variant: "destructive" });
      },
    }
  );

  const rejectMutation = useApiMutation(
    (assignmentId: number) => apiPut<any>(`/api/lead-assignments/${assignmentId}`, { status: "rejected" }),
    {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Assignment rejected" });
        queryClient.invalidateQueries({ queryKey: ["lead-assignments", currentUserId, "assigned"] });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to reject assignment", variant: "destructive" });
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
              <TableHead className="cursor-pointer" onClick={()=>onSortChange?.("leadId")}>
                Lead ID
              </TableHead>
              <TableHead className="cursor-pointer" onClick={()=>onSortChange?.("propertyAddress")}>
                Property Address
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="cursor-pointer" onClick={()=>onSortChange?.("status")}>
                Status
              </TableHead>
              <TableHead className="cursor-pointer" onClick={()=>onSortChange?.("arv")}>
                ARV
              </TableHead>
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
                    className={`${statusColors[lead.status] ?? "bg-gray-500"} text-white`}
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
                  <Select onValueChange={(v)=> assignMutation.mutate({ leadId: lead.id, assignedToUserId: Number(v) })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {team.map((u: any)=> (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name || u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assignmentsByLead[lead.id] && assignmentsByLead[lead.id].assignedToUserId === currentUserId && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={()=> acceptMutation.mutate(assignmentsByLead[lead.id].id)}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={()=> rejectMutation.mutate(assignmentsByLead[lead.id].id)}>Reject</Button>
                    </div>
                  )}
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
