import Link from "next/link";

export default function ApiDocs() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>API Documentation</h1>
      <h2>Endpoints</h2>
      <ul>
        <li><code>GET /api/pipeline-stages</code> — list stages</li>
        <li><code>POST /api/pipeline-stages</code> — create stage (admin)</li>
        <li><code>PUT /api/pipeline-stages/&#123;id&#125;</code> — update stage (admin)</li>
        <li><code>DELETE /api/pipeline-stages/&#123;id&#125;</code> — delete stage (admin)</li>
        <li><code>GET /api/deals</code> — list deals</li>
        <li><code>POST /api/deals</code> — create deal</li>
        <li><code>GET /api/deals/&#123;id&#125;</code> — get deal</li>
        <li><code>PUT /api/deals/&#123;id&#125;</code> — update deal</li>
        <li><code>DELETE /api/deals/&#123;id&#125;</code> — delete deal</li>
        <li><code>POST /api/scheduled-calls</code> — schedule follow-up (supports <code>dealId</code>)</li>
      </ul>
      <p>OpenAPI: <Link href="/openapi.json">/openapi.json</Link></p>
    </div>
  );
}