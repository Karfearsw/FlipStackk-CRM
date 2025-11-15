"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityIcon } from "lucide-react";

export function ActivityFeed() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <ActivityIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-10">
          <ActivityIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No recent activity</p>
        </div>
      </CardContent>
    </Card>
  );
}
