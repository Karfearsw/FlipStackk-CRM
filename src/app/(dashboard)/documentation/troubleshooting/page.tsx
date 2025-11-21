export default function Troubleshooting() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>Troubleshooting</h1>
      <h2>Common Issues</h2>
      <ul>
        <li>Cannot drag deals: ensure stages exist in Settings.</li>
        <li>401 errors: sign in at <code>/auth</code>.</li>
        <li>Metrics empty: create deals and set values.</li>
      </ul>
      <h2>Debug Tips</h2>
      <ul>
        <li>Check API responses in browser devtools network tab.</li>
        <li>Verify database connection (<code>DATABASE_URL</code>).</li>
      </ul>
    </div>
  );
}