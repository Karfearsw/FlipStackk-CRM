"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/use-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LeadsDuplicatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadsDuplicatesDialog({ open, onOpenChange }: LeadsDuplicatesDialogProps) {
  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ["leads-duplicates", open],
    queryFn: () => apiGet<any[]>("/api/leads/duplicates"),
    enabled: open,
    staleTime: 10_000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Potential Duplicate Leads</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-muted-foreground">Loading duplicates…</div>
        ) : duplicates.length === 0 ? (
          <div className="text-muted-foreground">No potential duplicates were found.</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Count</TableHead>
                  <TableHead>Lead IDs</TableHead>
                  <TableHead>Samples</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((g: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{g.count}</TableCell>
                    <TableCell>{g.leadIds.join(", ")}</TableCell>
                    <TableCell>
                      {g.sample.map((s: any) => (
                        <div key={s.id} className="text-sm">
                          {s.propertyAddress} — {s.ownerName ?? ""} {s.ownerPhone ?? ""} {s.ownerEmail ?? ""}
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}