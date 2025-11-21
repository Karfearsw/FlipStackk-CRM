"use client";

import { DealPipeline } from "@/components/dashboard/deal-pipeline";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelinePage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
      </Card>
      <DealPipeline />
    </div>
  );
}