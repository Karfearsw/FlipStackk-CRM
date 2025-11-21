import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Edit, Trash2 } from "lucide-react";

export function MarketingAutomationDashboard() {
  const campaigns = [
    {
      id: 1,
      name: "Lead Welcome Series",
      status: "active",
      type: "email",
      recipients: 245,
      openRate: 23.5,
      clickRate: 4.2,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Property Evaluation Follow-up",
      status: "paused",
      type: "sms",
      recipients: 89,
      openRate: 67.8,
      clickRate: 12.3,
      createdAt: "2024-01-10"
    }
  ];

  const workflows = [
    {
      id: 1,
      name: "Lead Qualification",
      status: "active",
      triggers: ["New Lead", "Form Submission"],
      actions: ["Send Email", "Assign Agent", "Schedule Call"],
      lastRun: "2 hours ago"
    },
    {
      id: 2,
      name: "Deal Follow-up",
      status: "draft",
      triggers: ["Deal Created"],
      actions: ["Send SMS", "Update Status"],
      lastRun: "Never"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Automation</h1>
          <p className="text-muted-foreground">
            Create and manage automated marketing campaigns
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{campaign.name}</h3>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">{campaign.type.toUpperCase()}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.recipients} recipients • {campaign.openRate}% open rate • {campaign.clickRate}% click rate
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{workflow.name}</h3>
                      <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                        {workflow.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Triggers: {workflow.triggers.join(", ")} • Last run: {workflow.lastRun}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Actions: {workflow.actions.join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      {workflow.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}