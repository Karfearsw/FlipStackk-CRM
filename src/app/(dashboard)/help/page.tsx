"use client";

import { useApiQuery } from "@/hooks/use-api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

type Document = { id: number; title: string; slug: string; tags?: string };
type TrainingModule = { id: number; title: string; description?: string };

export default function HelpCenterPage() {
  const { data: docs = [] } = useApiQuery<Document[]>(["docs"], "/api/documents");
  const { data: modules = [] } = useApiQuery<TrainingModule[]>(["training-modules"], "/api/training/modules");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-muted-foreground">No documentation yet</div>
          ) : (
            <ul className="space-y-2">
              {docs.map(doc => (
                <li key={doc.id}>
                  <Link className="underline" href={`/documentation/${doc.slug}`}>{doc.title}</Link>
                  {doc.tags && <span className="ml-2 text-xs text-muted-foreground">{doc.tags}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Training Modules</CardTitle>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-muted-foreground">No training modules yet</div>
          ) : (
            <ul className="space-y-2">
              {modules.map(m => (
                <li key={m.id}>
                  <span className="font-medium">{m.title}</span>
                  {m.description && <div className="text-sm text-muted-foreground">{m.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}