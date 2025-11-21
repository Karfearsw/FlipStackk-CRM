"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AnnouncementBannerProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function AnnouncementBanner({ title, description, ctaLabel = "Learn More", onCtaClick, className }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`rounded-md border bg-blue-50 text-blue-900 p-4 flex items-start justify-between ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 mt-0.5" />
        <div>
          <div className="font-semibold">{title}</div>
          {description && (
            <div className="text-sm mt-1 text-blue-800">{description}</div>
          )}
          {ctaLabel && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => {
                if (onCtaClick) onCtaClick();
                else setOpen(true);
              }}>{ctaLabel}</Button>
            </div>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>Dismiss</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Management Training</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Use the Leads page to add, search, filter, and assign leads. Update status as you progress.</p>
            <p>Quick actions include editing, deleting, assignment and accepting/rejecting assigned leads.</p>
            <p>Export current leads to CSV for sharing; import CSV to bulk add leads from external lists.</p>
            <p>Review potential duplicates by address, phone or email and resolve conflicts.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}