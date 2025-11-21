"use client";

import { useApiQuery, apiPost, apiPut, apiDelete } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type PipelineStage = { id: number; name: string; orderIndex: number; isActive: boolean };

export default function PipelineSettingsPage() {
  const { data: stages = [], refetch } = useApiQuery<PipelineStage[]>(["pipeline-stages"], "/api/pipeline-stages");
  const [newStage, setNewStage] = useState<{ name: string; orderIndex: number }>({ name: "", orderIndex: stages.length });

  const addStage = async () => {
    if (!newStage.name) return;
    await apiPost("/api/pipeline-stages", { name: newStage.name, orderIndex: newStage.orderIndex });
    setNewStage({ name: "", orderIndex: stages.length + 1 });
    await refetch();
  };

  const toggleStage = async (stage: PipelineStage) => {
    await apiPut(`/api/pipeline-stages/${stage.id}`, { isActive: !stage.isActive });
    await refetch();
  };

  const deleteStage = async (stage: PipelineStage) => {
    await apiDelete(`/api/pipeline-stages/${stage.id}`);
    await refetch();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div>
              <Label htmlFor="name">Stage Name</Label>
              <Input id="name" value={newStage.name} onChange={(e) => setNewStage((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" value={newStage.orderIndex} onChange={(e) => setNewStage((s) => ({ ...s, orderIndex: Number(e.target.value) }))} />
            </div>
            <Button onClick={addStage}>Add Stage</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stages.sort((a,b) => a.orderIndex - b.orderIndex).map(stage => (
              <div key={stage.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{stage.name}</div>
                  <div className="text-xs text-muted-foreground">Order: {stage.orderIndex}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => toggleStage(stage)}>{stage.isActive ? 'Disable' : 'Enable'}</Button>
                  <Button variant="destructive" onClick={() => deleteStage(stage)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}