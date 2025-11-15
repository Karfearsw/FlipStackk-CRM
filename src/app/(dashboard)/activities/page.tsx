"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/hooks/use-api";
import { Activity, Search, Filter } from "lucide-react";
import { format } from "date-fns";

export default function ActivitiesPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => apiGet<any[]>("/api/activities"),
  });

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      !search ||
      activity.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || activity.actionType === filterType;
    return matchesSearch && matchesType;
  });

  const actionTypes = Array.from(new Set(activities.map((a) => a.actionType)));

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">
              System activity log and history
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Feed ({filteredActivities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredActivities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No activities found
              </p>
            ) : (
              <div className="space-y-4">
                {filteredActivities.slice(0, 50).map((activity, index) => (
                  <div key={activity.id || index}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {activity.actionType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {index < filteredActivities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
