"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsList } from "@/components/leads/leads-list";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { LeadFilters } from "@/components/leads/lead-filters";
import { apiGet } from "@/hooks/use-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { LeadsImportDialog } from "@/components/leads/leads-import-dialog";
import { LeadsExportButton } from "@/components/leads/leads-export-button";
import { LeadsDuplicatesDialog } from "@/components/leads/leads-duplicates-dialog";

export default function LeadsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string|undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data: leads = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["leads", debouncedSearch, filters, sortBy, sortOrder, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filters.status) params.set("status", filters.status);
      if (filters.assignedToUserId) params.set("assignedToUserId", String(filters.assignedToUserId));
      if (filters.createdByUserId) params.set("createdByUserId", String(filters.createdByUserId));
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      params.set("limit", String(pageSize));
      params.set("offset", String((page-1)*pageSize));
      const query = params.toString();
      return apiGet<any[]>(`/api/leads${query ? `?${query}` : ""}`);
    },
    staleTime: 5_000,
  });

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <AnnouncementBanner
          title="Lead Management Training"
          description="Learn best practices for adding, filtering, assigning, and updating leads."
          ctaLabel="View Training"
        />
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
              <Select value={String(pageSize)} onValueChange={(v)=>{setPageSize(parseInt(v)); setPage(1);}}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <LeadsExportButton leads={leads} />
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>Import CSV</Button>
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" onClick={() => setIsDuplicatesOpen(true)}>Duplicates</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="mb-4 rounded-md border border-destructive p-3 text-destructive">
                Failed to load leads. Please check your connection or authentication.
              </div>
            )}
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
              onSortChange={(column)=>{
                setSortBy(column);
                setSortOrder(prev=> (column === sortBy && prev === "desc") ? "asc" : "desc");
              }}
            />
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Page {page}</div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
                <Button variant="outline" onClick={()=>setPage(p=>p+1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      <LeadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={refetch}
      />

      <LeadsImportDialog
        open={isImportOpen}
        onOpenChange={(o)=> setIsImportOpen(o)}
        onImported={refetch}
      />

      <LeadsDuplicatesDialog
        open={isDuplicatesOpen}
        onOpenChange={(o)=> setIsDuplicatesOpen(o)}
      />

      <Button
        onClick={()=> setIsCreateOpen(true)}
        className="fixed bottom-20 right-6 rounded-full h-12 w-12 p-0 shadow-lg"
        aria-label="Add Lead"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  </div>
);
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(()=>{
    const t = setTimeout(()=> setDebounced(value), delay);
    return ()=> clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
