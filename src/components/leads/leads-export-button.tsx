"use client";

import { Button } from "@/components/ui/button";

interface LeadsExportButtonProps {
  leads: any[];
}

export function LeadsExportButton({ leads }: LeadsExportButtonProps) {
  const onExport = () => {
    const headers = [
      "id","leadId","propertyAddress","city","state","zip","ownerName","ownerPhone","ownerEmail","status","propertyType","source","notes","estimatedValue","arv","repairCost","assignedToUserId","createdAt","updatedAt"
    ];
    const rows = leads.map((l: any) => headers.map(h => (l[h] ?? "")).toString());
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="outline" onClick={onExport}>Export CSV</Button>
  );
}