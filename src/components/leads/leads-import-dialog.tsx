"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/hooks/use-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LeadsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

type ParsedRow = Record<string, string>;

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

export function LeadsImportDialog({ open, onOpenChange, onImported }: LeadsImportDialogProps) {
  const { toast } = useToast();
  const [fileText, setFileText] = useState<string>("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (!open) {
      setFileText("");
      setRows([]);
      setImporting(false);
      setImportedCount(0);
    }
  }, [open]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setFileText(text);
    const parsed = parseCsv(text);
    setRows(parsed);
    toast({ title: "CSV parsed", description: `${parsed.length} rows detected` });
  };

  const onImport = async () => {
    if (rows.length === 0) { toast({ title: "No rows", description: "Please select a CSV with data", variant: "destructive" }); return; }
    setImporting(true);
    setImportedCount(0);
    let success = 0;
    for (const r of rows) {
      try {
        const payload: any = {
          propertyAddress: r.propertyAddress || r.address || r.PropertyAddress || r.Address || "",
          city: r.city || r.City || "",
          state: r.state || r.State || "",
          zip: r.zip || r.Zip || "",
          ownerName: r.ownerName || r.OwnerName || r.name || r.Name || "",
          ownerPhone: r.ownerPhone || r.phone || r.Phone || "",
          ownerEmail: r.ownerEmail || r.email || r.Email || "",
          status: r.status || r.Status || "new",
          propertyType: r.propertyType || r.PropertyType || "single-family",
          source: r.source || r.Source || "other",
          notes: r.notes || r.Notes || "",
          estimatedValue: r.estimatedValue || r.EstimatedValue || "",
          arv: r.arv || r.ARV || "",
          repairCost: r.repairCost || r.RepairCost || "",
        };
        await apiPost("/api/leads", payload);
        success++;
        setImportedCount(success);
      } catch {}
    }
    setImporting(false);
    toast({ title: "Import complete", description: `${success} of ${rows.length} rows imported` });
    onImported?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>Upload a CSV with headers like propertyAddress, city, state, zip, ownerName, ownerPhone, ownerEmail, status, propertyType, source, notes, estimatedValue, arv, repairCost.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
          {rows.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Address</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.propertyAddress || r.address || r.PropertyAddress || r.Address || ""}</TableCell>
                      <TableCell>{r.ownerName || r.OwnerName || r.name || r.Name || ""}</TableCell>
                      <TableCell>{(r.ownerPhone || r.phone || r.Phone || "") || (r.ownerEmail || r.email || r.Email || "")}</TableCell>
                      <TableCell>{r.status || r.Status || "new"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-xs text-muted-foreground p-2">Showing first 10 rows</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onImport} disabled={importing || rows.length === 0}>{importing ? `Importing (${importedCount}/${rows.length})` : "Start Import"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}