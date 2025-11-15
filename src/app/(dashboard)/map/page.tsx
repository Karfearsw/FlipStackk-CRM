"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/hooks/use-api";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Dynamically import Map component to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/map/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] flex items-center justify-center bg-muted rounded-lg">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => apiGet<any[]>("/api/leads"),
  });

  const filteredLeads = leads.filter((lead) => 
    statusFilter === "all" || lead.status === statusFilter
  );

  const leadsWithCoordinates = filteredLeads.filter((lead) => 
    lead.latitude && lead.longitude
  );

  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    unqualified: leads.filter(l => l.status === "unqualified").length,
    closed: leads.filter(l => l.status === "closed").length,
  };

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Property Map</h1>
            <p className="text-muted-foreground">
              Visualize leads by location and status
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="new">New ({statusCounts.new})</SelectItem>
              <SelectItem value="contacted">Contacted ({statusCounts.contacted})</SelectItem>
              <SelectItem value="qualified">Qualified ({statusCounts.qualified})</SelectItem>
              <SelectItem value="unqualified">Unqualified ({statusCounts.unqualified})</SelectItem>
              <SelectItem value="closed">Closed ({statusCounts.closed})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading properties...</p>
            </CardContent>
          </Card>
        ) : leadsWithCoordinates.length === 0 ? (
          <Card>
            <CardContent className="h-[600px] flex flex-col items-center justify-center gap-4">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">No Properties to Display</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Properties need latitude and longitude coordinates to appear on the map.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map */}
            <div className="lg:col-span-2">
              <MapView leads={leadsWithCoordinates} />
            </div>

            {/* Property List */}
            <Card>
              <CardHeader>
                <CardTitle>Properties ({filteredLeads.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredLeads.slice(0, 20).map((lead) => (
                  <div key={lead.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{lead.propertyAddress}</h4>
                        <p className="text-xs text-muted-foreground">
                          {lead.city}, {lead.state} {lead.zip}
                        </p>
                      </div>
                      <Badge variant={
                        lead.status === "new" ? "default" :
                        lead.status === "qualified" ? "success" :
                        lead.status === "closed" ? "secondary" : "outline"
                      }>
                        {lead.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{lead.ownerPhone || "No phone"}</span>
                    </div>
                    
                    {lead.estimatedValue && (
                      <div className="text-xs font-medium">
                        Est. Value: ${Number(lead.estimatedValue).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
