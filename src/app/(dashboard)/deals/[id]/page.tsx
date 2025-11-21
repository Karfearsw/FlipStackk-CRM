"use client";

import { useParams } from "next/navigation";
import { useApiQuery, apiPut } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiPost } from "@/hooks/use-api";

type Deal = {
  id: number;
  title: string;
  value: string;
  probability: number;
  expectedCloseDate: string | null;
  ownerUserId: number;
  stageId: number;
  status: string;
  notes?: string;
};

export default function DealPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: deal } = useApiQuery<Deal>(["deal", id], `/api/deals/${id}`);
  const [form, setForm] = useState<Partial<Deal>>({});
  const [reminder, setReminder] = useState<{ when: string; notes: string }>({ when: "", notes: "" });

  if (!deal) return <div>Loading...</div>;

  const onSave = async () => {
    await apiPut(`/api/deals/${id}`, form);
    location.reload();
  };

  const scheduleReminder = async () => {
    if (!reminder.when) return;
    await apiPost("/api/scheduled-calls", {
      dealId: id,
      assignedCallerId: deal.ownerUserId,
      scheduledTime: reminder.when,
      notes: reminder.notes,
    });
    setReminder({ when: "", notes: "" });
    alert("Reminder scheduled");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Deal Management</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={deal.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="value">Value</Label>
            <Input id="value" type="number" defaultValue={Number(deal.value)} onChange={(e) => setForm((f) => ({ ...f, value: String(Number(e.target.value)) }))} />
          </div>
          <div>
            <Label htmlFor="probability">Probability (%)</Label>
            <Input id="probability" type="number" defaultValue={deal.probability} onChange={(e) => setForm((f) => ({ ...f, probability: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="date">Expected Close Date</Label>
            <Input id="date" type="date" defaultValue={deal.expectedCloseDate ? deal.expectedCloseDate.substring(0,10) : ''} onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" defaultValue={deal.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up Reminder</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="when">When</Label>
            <Input id="when" type="datetime-local" value={reminder.when} onChange={(e) => setReminder((r) => ({ ...r, when: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="rnotes">Notes</Label>
            <Input id="rnotes" value={reminder.notes} onChange={(e) => setReminder((r) => ({ ...r, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={scheduleReminder}>Schedule Reminder</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}