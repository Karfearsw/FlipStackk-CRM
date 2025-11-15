"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3Icon } from "lucide-react";

export function DealPipeline() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deal Pipeline</CardTitle>
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-10">
          <p className="text-muted-foreground">No deals in pipeline yet</p>
          <p className="text-sm text-muted-foreground mt-2">Add leads to see your deal pipeline</p>
        </div>
      </CardContent>
    </Card>
  );
}
