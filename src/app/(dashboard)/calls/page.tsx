"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet, apiPost } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const scheduleCallSchema = z.object({
  leadId: z.number(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
});

const logCallSchema = z.object({
  leadId: z.number(),
  duration: z.number().min(1),
  outcome: z.string(),
  notes: z.string().optional(),
});

type ScheduleCallFormValues = z.infer<typeof scheduleCallSchema>;
type LogCallFormValues = z.infer<typeof logCallSchema>;

export default function CallsPage() {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduledCalls = [], isLoading: scheduledLoading } = useQuery({
    queryKey: ["scheduled-calls"],
    queryFn: () => apiGet<any[]>("/api/scheduled-calls"),
  });

  const { data: callHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["calls"],
    queryFn: () => apiGet<any[]>("/api/calls"),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => apiGet<any[]>("/api/leads"),
  });

  const scheduleForm = useForm<ScheduleCallFormValues>({
    resolver: zodResolver(scheduleCallSchema),
    defaultValues: {
      leadId: 0,
      scheduledAt: "",
      notes: "",
    },
  });

  const logForm = useForm<LogCallFormValues>({
    resolver: zodResolver(logCallSchema),
    defaultValues: {
      leadId: 0,
      duration: 5,
      outcome: "no-answer",
      notes: "",
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: ScheduleCallFormValues) =>
      apiPost("/api/scheduled-calls", {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
      }),
    onSuccess: () => {
      toast({ title: "Call scheduled successfully" });
      queryClient.invalidateQueries({ queryKey: ["scheduled-calls"] });
      setIsScheduleDialogOpen(false);
      scheduleForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule call", variant: "destructive" });
    },
  });

  const logMutation = useMutation({
    mutationFn: (data: LogCallFormValues) => apiPost("/api/calls", data),
    onSuccess: () => {
      toast({ title: "Call logged successfully" });
      queryClient.invalidateQueries({ queryKey: ["calls"] });
      setIsLogDialogOpen(false);
      logForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to log call", variant: "destructive" });
    },
  });

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
            <p className="text-muted-foreground">
              Manage scheduled calls and call history
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsLogDialogOpen(true)}>
              <Phone className="h-4 w-4 mr-2" />
              Log Call
            </Button>
            <Button onClick={() => setIsScheduleDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Call
            </Button>
          </div>
        </div>

        <Tabs defaultValue="scheduled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduled">Scheduled Calls</TabsTrigger>
            <TabsTrigger value="history">Call History</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Calls</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : scheduledCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scheduled calls
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledCalls.map((call: any) => (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{call.leadId}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(call.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Call Now</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : callHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No call history
                  </div>
                ) : (
                  <div className="space-y-4">
                    {callHistory.map((call: any) => (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Lead #{call.leadId}</p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {call.duration} minutes - {call.outcome}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Call</DialogTitle>
            </DialogHeader>
            <Form {...scheduleForm}>
              <form onSubmit={scheduleForm.handleSubmit((data) => scheduleMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={scheduleForm.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead: any) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.propertyAddress} - {lead.ownerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={scheduleMutation.isPending}>
                    {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Call</DialogTitle>
            </DialogHeader>
            <Form {...logForm}>
              <form onSubmit={logForm.handleSubmit((data) => logMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={logForm.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead: any) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.propertyAddress} - {lead.ownerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcome</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-answer">No Answer</SelectItem>
                          <SelectItem value="voicemail">Voicemail</SelectItem>
                          <SelectItem value="connected">Connected</SelectItem>
                          <SelectItem value="scheduled-callback">Scheduled Callback</SelectItem>
                          <SelectItem value="not-interested">Not Interested</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsLogDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={logMutation.isPending}>
                    {logMutation.isPending ? "Logging..." : "Log Call"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
