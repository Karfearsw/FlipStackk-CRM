"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/use-api";

interface LeadFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  className?: string;
}

export function LeadFilters({ filters, onFiltersChange, className }: LeadFiltersProps) {
  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => apiGet<any[]>("/api/team"),
  });
  return (
    <div className={`flex gap-4 ${className}`}>
      <Select
        value={filters.status || "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value === "all" ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="qualified">Qualified</SelectItem>
          <SelectItem value="unqualified">Unqualified</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assignedToUserId?.toString() || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            assignedToUserId: value === "all" ? undefined : parseInt(value),
          })
        }
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Assigned To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {team.map((user: any) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.createdByUserId?.toString() || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            createdByUserId: value === "all" ? undefined : parseInt(value),
          })
        }
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Created By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Creators</SelectItem>
          {team.map((user: any) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
