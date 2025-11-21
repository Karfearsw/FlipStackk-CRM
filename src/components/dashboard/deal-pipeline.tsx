"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3Icon } from "lucide-react";
import { useApiQuery, apiPut } from "@/hooks/use-api";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";

type PipelineStage = {
  id: number;
  name: string;
  orderIndex: number;
  isActive: boolean;
};

type Deal = {
  id: number;
  title: string;
  value: string;
  probability: number;
  expectedCloseDate: string | null;
  ownerUserId: number;
  stageId: number;
  status: string;
};

function DroppableColumn({ stageId, children }: { stageId: number; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `stage-${stageId}`, data: { stageId } });
  return (
    <div ref={setNodeRef} className="p-2 min-h-40" data-stage-id={stageId}>
      {children}
    </div>
  );
}

function DraggableDeal({ deal, dragging }: { deal: Deal; dragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `deal-${deal.id}`, data: { dealId: deal.id } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`mb-2 rounded border bg-background p-3 shadow-sm cursor-move ${dragging ? 'opacity-50' : ''}`}
      data-deal-id={deal.id}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium truncate">{deal.title}</div>
        <div className="text-sm text-muted-foreground">${Number(deal.value).toLocaleString()}</div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>Prob: {deal.probability}%</span>
        <span>{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '-'}</span>
      </div>
    </div>
  );
}

export function DealPipeline() {
  const { data: stages = [] } = useApiQuery<PipelineStage[]>(["pipeline-stages"], "/api/pipeline-stages");
  const { data: deals = [] , refetch } = useApiQuery<Deal[]>(["deals"], "/api/deals");

  const columns = useMemo(() => stages.filter(s => s.isActive).sort((a, b) => a.orderIndex - b.orderIndex), [stages]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, Deal[]>();
    columns.forEach(c => map.set(c.id, []));
    deals.forEach(d => {
      if (!map.has(d.stageId)) map.set(d.stageId, []);
      map.get(d.stageId)!.push(d);
    });
    return map;
  }, [columns, deals]);

  async function onDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const dealId = event.active?.data?.current?.dealId as number | undefined;
    const newStageId = event.over?.data?.current?.stageId as number | undefined;
    if (dealId && newStageId) {
      await apiPut(`/api/deals/${dealId}`, { stageId: newStageId });
      await refetch();
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deal Pipeline</CardTitle>
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {columns.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No stages configured</p>
            <p className="text-sm text-muted-foreground mt-2">Add stages in Settings → Pipeline</p>
          </div>
        ) : (
          <DndContext onDragEnd={onDragEnd} onDragStart={(e) => setDraggingId(e.active?.data?.current?.dealId ?? null)}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {columns.map((col) => (
                <div key={col.id} className="rounded-md border bg-card">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <span className="font-medium">{col.name}</span>
                    <Badge variant="secondary">{grouped.get(col.id)?.length ?? 0}</Badge>
                  </div>
                  <DroppableColumn stageId={col.id}>
                    <SortableContext items={(grouped.get(col.id) || []).map(d => `deal-${d.id}`)} strategy={verticalListSortingStrategy}>
                      {(grouped.get(col.id) || []).map((deal) => (
                        <DraggableDeal key={deal.id} deal={deal} dragging={draggingId === deal.id} />
                      ))}
                    </SortableContext>
                  </DroppableColumn>
                </div>
              ))}
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
