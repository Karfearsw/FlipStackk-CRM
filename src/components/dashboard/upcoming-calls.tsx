"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpcomingCalls() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Upcoming Calls</CardTitle>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-10">
          <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground mb-4">No upcoming calls scheduled</p>
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Schedule Your First Call
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
