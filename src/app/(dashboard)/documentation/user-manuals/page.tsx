export default function UserManuals() {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <h1>User Manuals</h1>
      <h2>Pipeline View</h2>
      <ol>
        <li>Open Pipeline from the sidebar.</li>
        <li>Drag a deal card to a different stage.</li>
        <li>Click a deal to open details and edit fields.</li>
      </ol>
      <h2>Deal Management</h2>
      <ol>
        <li>Edit title, value, probability, expected close date, notes.</li>
        <li>Use Follow-up Reminder to schedule a call.</li>
      </ol>
      <h2>Reports</h2>
      <p>View conversion, average deal size, and sales velocity in Analytics.</p>
    </div>
  );
}