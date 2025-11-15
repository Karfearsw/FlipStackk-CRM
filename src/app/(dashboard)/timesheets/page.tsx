"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const timesheetSchema = z.object({
  date: z.string(),
  description: z.string().min(3),
  activityType: z.string(),
  totalHours: z.number().min(0.25).max(24),
});

type TimesheetFormValues = z.infer<typeof timesheetSchema>;

export default function TimesheetsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: () => apiGet<any[]>("/api/timesheets"),
  });

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      activityType: "calling",
      totalHours: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TimesheetFormValues) =>
      apiPost("/api/timesheets", {
        ...data,
        date: new Date(data.date),
      }),
    onSuccess: () => {
      toast({ title: "Timesheet entry created" });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create entry", variant: "destructive" });
    },
  });

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
            <p className="text-muted-foreground">
              Track your time and submit for approval
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : timesheets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No timesheet entries found
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()} - {entry.totalHours} hours
                      </p>
                    </div>
                    <Badge variant={entry.approved ? "default" : "secondary"}>
                      {entry.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timesheet Entry</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="calling">Phone Calls</SelectItem>
                          <SelectItem value="meetings">Client Meetings</SelectItem>
                          <SelectItem value="paperwork">Paperwork</SelectItem>
                          <SelectItem value="property-visits">Property Visits</SelectItem>
                          <SelectItem value="admin">Administrative</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.25" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Entry"}
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
