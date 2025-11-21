"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({ title: "Error", description: "Title, slug, and content are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, content, tags }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast({ title: "Success", description: "Document created" });
      router.push("/documentation");
    } catch (err) {
      toast({ title: "Error", description: "Error creating document", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Document</h1>
            <p className="text-muted-foreground">Create a new knowledge base entry</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (unique)" required />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content (Markdown supported)" rows={10} required />
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated)" />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Document"}</Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}