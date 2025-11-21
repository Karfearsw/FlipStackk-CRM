export default function SystemOverview() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Sales Pipeline System Overview</h1>
      <h2>Architecture</h2>
      <p>Next.js App Router with TypeScript, Tailwind, Radix UI, React Query, and Drizzle ORM (Postgres). API routes under <code>src/app/api</code>. Data models in <code>src/db/schema.ts</code>.</p>
      <h2>Core Components</h2>
      <ul>
        <li>Pipeline Stages: customizable stages stored in <code>pipeline_stages</code></li>
        <li>Deals: opportunities with value, probability, expected close date, owner</li>
        <li>Activities: audit trail for create/update/schedule actions</li>
        <li>Reminders: scheduled follow-ups via <code>scheduled_calls</code> linked to deals</li>
        <li>Reporting: analytics page shows conversion, average deal size, sales velocity</li>
      </ul>
      <h2>Pages</h2>
      <ul>
        <li>Dashboard: summary metrics and pipeline widget</li>
        <li>Pipeline View: kanban board to drag deals across stages</li>
        <li>Deal Management: edit deal details and schedule reminders</li>
        <li>Reports: analytics and KPIs</li>
        <li>Settings: manage pipeline stages</li>
        <li>Help Center: documentation and training</li>
      </ul>
    </div>
  );
}