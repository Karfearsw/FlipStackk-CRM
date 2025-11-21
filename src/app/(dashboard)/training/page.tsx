"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: number;
  title: string;
  description: string | null;
}

export default function TrainingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mods, setMods] = useState<Module[]>([]);

  async function load() {
    const res = await fetch(`/api/training/modules`);
    if (res.ok) setMods(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enroll(moduleId: number) {
    try {
      const res = await fetch(`/api/training/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId })
      });
      if (!res.ok) throw new Error("Enrollment failed");
      toast({ title: "Success", description: "Enrolled successfully" });
    } catch {
      toast({ title: "Error", description: "Enrollment failed", variant: "destructive" });
    }
  }

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training</h1>
            <p className="text-muted-foreground">Interactive modules, progress, assessments</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {mods.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle>{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.description || 'No description'}</p>
                <div className="mt-4">
                  <Button onClick={() => enroll(m.id)}>Enroll</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}