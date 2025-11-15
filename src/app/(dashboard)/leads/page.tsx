"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsList } from "@/components/leads/leads-list";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { LeadFilters } from "@/components/leads/lead-filters";
import { apiGet } from "@/hooks/use-api";

export default function LeadsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ["leads", searchTerm, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filters.status) params.set("status", filters.status);
      if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
      const query = params.toString();
      return apiGet<any[]>(`/api/leads${query ? `?${query}` : ""}`);
    },
  });

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Manage your property leads and contacts
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by address, name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isFiltersOpen && (
              <LeadFilters
                filters={filters}
                onFiltersChange={setFilters}
                className="mb-6"
              />
            )}
            <LeadsList
              leads={leads}
              isLoading={isLoading}
              onRefetch={refetch}
            />
          </CardContent>
        </Card>

        <LeadDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
