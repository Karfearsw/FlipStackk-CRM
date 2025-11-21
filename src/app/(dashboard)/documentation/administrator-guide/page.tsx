export default function AdministratorGuide() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Administrator Guide</h1>
      <h2>Pipeline Configuration</h2>
      <ol>
        <li>Navigate to Settings → Pipeline.</li>
        <li>Add, re-order, enable/disable stages.</li>
        <li>Ensure stage names map to your sales process.</li>
      </ol>
      <h2>User Roles</h2>
      <p>Admins can manage stages. Owners are set per deal via ownerUserId.</p>
      <h2>Data</h2>
      <p>Models: <code>pipeline_stages</code>, <code>deals</code>, activities, scheduled_calls.</p>
    </div>
  );
}