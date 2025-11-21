"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/hooks/use-api";
import { useApiMutation } from "@/hooks/use-api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const leadSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  ownerName: z.string().optional().default(""),
  ownerPhone: z.string().optional().default(""),
  ownerEmail: z.string().email("Invalid email").optional().or(z.literal("")).default(""),
  status: z.enum(["new", "contacted", "qualified", "unqualified", "closed"]).default("new"),
  propertyType: z.enum(["single-family", "multi-family", "condo", "commercial", "land"]).default("single-family"),
  source: z.enum(["cold-call", "direct-mail", "referral", "online", "other"]).default("other"),
  notes: z.string().optional().default(""),
  estimatedValue: z.string().optional().default(""),
  arv: z.string().optional().default(""),
  repairCost: z.string().optional().default(""),
  assignedToUserId: z.number().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

// Explicit type for form default values to ensure proper typing
interface LeadFormDefaultValues extends Partial<LeadFormValues> {
  propertyAddress: string;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  onSuccess?: () => void;
}

export function LeadDialog({ open, onOpenChange, lead, onSuccess }: LeadDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [smsText, setSmsText] = useState("");
  const [discordText, setDiscordText] = useState("");
  const discordMutation = useApiMutation(
    (payload: { leadId: number; body: string }) => apiPost<any>("/api/communications/send", { type: "discord", ...payload }),
    {
      onSuccess: () => {
        toast({ title: "Sent to Discord", description: "Message dispatched" });
        setDiscordText("");
        queryClient.invalidateQueries({ queryKey: ["communications", lead?.id] });
      },
      onError: () => {
        toast({ title: "Discord failed", description: "Could not send message", variant: "destructive" });
      },
    }
  );
  const smsMutation = useApiMutation(
    (payload: { leadId: number; to: string; body: string }) => apiPost<any>("/api/communications/send", { type: "sms", ...payload }),
    {
      onSuccess: () => {
        toast({ title: "SMS sent", description: "Message dispatched" });
        queryClient.invalidateQueries({ queryKey: ["communications", lead?.id] });
      },
      onError: () => {
        toast({ title: "SMS failed", description: "Could not send message", variant: "destructive" });
      },
    }
  );

  const { data: users = [] } = useQuery({
    queryKey: ["team"],
    queryFn: () => apiGet<any[]>("/api/team"),
  });

  const form = useForm<LeadFormValues, any, LeadFormValues>({
    resolver: zodResolver(leadSchema) as Resolver<LeadFormValues>,
    defaultValues: {
      propertyAddress: "",
      city: "",
      state: "",
      zip: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      status: "new",
      propertyType: "single-family",
      source: "other",
      notes: "",
      estimatedValue: "",
      arv: "",
      repairCost: "",
    } as LeadFormValues,
  });

  useEffect(() => {
    if (lead) {
      form.reset({
        propertyAddress: lead.propertyAddress || "",
        city: lead.city || "",
        state: lead.state || "",
        zip: lead.zip || "",
        ownerName: lead.ownerName || "",
        ownerPhone: lead.ownerPhone || "",
        ownerEmail: lead.ownerEmail || "",
        status: lead.status || "new" as const,
        propertyType: lead.propertyType || "single-family" as const,
        source: lead.source || "other" as const,
        notes: lead.notes || "",
        estimatedValue: lead.estimatedValue?.toString() || "",
        arv: lead.arv?.toString() || "",
        repairCost: lead.repairCost?.toString() || "",
        assignedToUserId: lead.assignedToUserId,
      });
    } else {
      form.reset({
        propertyAddress: "",
        city: "",
        state: "",
        zip: "",
        ownerName: "",
        ownerPhone: "",
        ownerEmail: "",
        status: "new" as const,
        propertyType: "single-family" as const,
        source: "other" as const,
        notes: "",
        estimatedValue: "",
        arv: "",
        repairCost: "",
      });
    }
  }, [lead, form]);

  const mutation = useMutation<unknown, Error, LeadFormValues>({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        city: data.city || "City pending",
        state: data.state || "State pending",
        zip: data.zip || "00000",
        ownerName: data.ownerName || "Owner pending",
        status: data.status || "new" as const,
        propertyType: data.propertyType || "single-family" as const,
        source: data.source || "other" as const,
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue.replace(/\D/g, "")) : undefined,
        arv: data.arv ? Number(data.arv.replace(/\D/g, "")) : undefined,
        repairCost: data.repairCost ? Number(data.repairCost.replace(/\D/g, "")) : undefined,
      };
      
      if (lead) {
        return apiPut(`/api/leads/${lead.id}`, payload);
      } else {
        return apiPost("/api/leads", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: lead ? "Lead updated" : "Lead created",
        description: lead ? "The lead has been updated successfully" : "The lead has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          <DialogDescription>
            {lead ? "Update the lead information" : "Enter the information for this new potential deal"}
          </DialogDescription>
        </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertyAddress"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Property Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="owner@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="unqualified">Unqualified</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single-family">Single Family</SelectItem>
                        <SelectItem value="multi-family">Multi Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cold-call">Cold Call</SelectItem>
                        <SelectItem value="direct-mail">Direct Mail</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value</FormLabel>
                    <FormControl>
                      <Input placeholder="$250,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ARV</FormLabel>
                    <FormControl>
                      <Input placeholder="$300,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repairCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repair Cost</FormLabel>
                    <FormControl>
                      <Input placeholder="$50,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this lead..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {lead?.ownerPhone && (
                <div className="col-span-2 border rounded-md p-3 space-y-3">
                  <div className="text-sm font-medium">Quick SMS</div>
                  <Textarea placeholder="Type a message..." value={smsText} onChange={(e)=> setSmsText(e.target.value)} />
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={()=>{
                      const body = smsText?.trim();
                      if (!body) { toast({ title: "Empty message", description: "Please enter text", variant: "destructive" }); return; }
                      smsMutation.mutate({ leadId: lead.id, to: lead.ownerPhone, body });
                    }}>
                      Send SMS
                    </Button>
                  </div>
                </div>
              )}

              <div className="col-span-2 border rounded-md p-3 space-y-3">
                <div className="text-sm font-medium">Quick Discord</div>
                <Textarea placeholder="Type a message..." value={discordText} onChange={(e)=> setDiscordText(e.target.value)} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={()=>{
                    const body = discordText?.trim();
                    if (!body) { toast({ title: "Empty message", description: "Please enter text", variant: "destructive" }); return; }
                    discordMutation.mutate({ leadId: lead.id, body });
                  }}>
                    Send Discord
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
