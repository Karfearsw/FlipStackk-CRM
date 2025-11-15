"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon, PercentIcon, PieChartIcon } from "lucide-react";

export function SummaryMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Pipeline Value
            <DollarSignIcon className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription>Total value of all leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$0</div>
          <div className="text-xs text-muted-foreground mt-1">
            0 total leads in pipeline
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Hot Lead Ratio
            <PercentIcon className="h-5 w-5 text-orange-500" />
          </CardTitle>
          <CardDescription>Highly motivated leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0%</div>
          <div className="text-xs text-muted-foreground mt-1">
            0 high motivation leads
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Deal Closing Rate
            <PieChartIcon className="h-5 w-5 text-blue-500" />
          </CardTitle>
          <CardDescription>Closed deals performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0%</div>
          <div className="text-xs text-muted-foreground mt-1">
            0 closed deals
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
