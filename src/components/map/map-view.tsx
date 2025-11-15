"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink } from "lucide-react";
import Link from "next/link";

// Fix Leaflet default icon issue with Next.js
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Lead {
  id: number;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerPhone?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  estimatedValue?: string | number;
}

interface MapViewProps {
  leads: Lead[];
}

// Custom marker icons based on status
const getMarkerIcon = (status: string) => {
  const iconUrls: Record<string, string> = {
    new: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    contacted: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    qualified: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    unqualified: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    closed: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  };

  return new Icon({
    iconUrl: iconUrls[status] || iconUrls.new,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

export default function MapView({ leads }: MapViewProps) {
  // Calculate center of all leads
  const avgLat = leads.reduce((sum, lead) => sum + (lead.latitude || 0), 0) / leads.length;
  const avgLng = leads.reduce((sum, lead) => sum + (lead.longitude || 0), 0) / leads.length;
  const center: LatLngExpression = [avgLat || 39.8283, avgLng || -98.5795]; // Default to US center

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {leads.map((lead) => {
          if (!lead.latitude || !lead.longitude) return null;
          
          return (
            <Marker
              key={lead.id}
              position={[lead.latitude, lead.longitude]}
              icon={getMarkerIcon(lead.status)}
            >
              <Popup>
                <div className="space-y-2 p-1 min-w-[200px]">
                  <div>
                    <h3 className="font-semibold text-sm">{lead.propertyAddress}</h3>
                    <p className="text-xs text-muted-foreground">
                      {lead.city}, {lead.state} {lead.zip}
                    </p>
                  </div>
                  
                  <Badge variant="outline" className="text-xs capitalize">
                    {lead.status}
                  </Badge>
                  
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>Owner:</strong> {lead.ownerName}
                    </div>
                    {lead.ownerPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${lead.ownerPhone}`} className="hover:underline">
                          {lead.ownerPhone}
                        </a>
                      </div>
                    )}
                    {lead.estimatedValue && (
                      <div>
                        <strong>Est. Value:</strong> ${Number(lead.estimatedValue).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/leads`}>
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
