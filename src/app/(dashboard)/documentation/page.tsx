"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


interface Doc {
  id: number;
  title: string;
  slug: string;
  content: string;
  tags: string | null;
}

export default function DocumentationPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch(`/api/documents${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground">Version-controlled knowledge base</p>
          </div>
          <Button onClick={() => router.push("/documentation/new")}>New Document</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" />
            <Button onClick={load}>Search</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle>{d.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Tags: {d.tags || "-"}</p>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{d.content}</p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => router.push(`/documentation/${d.slug}`)}>View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}