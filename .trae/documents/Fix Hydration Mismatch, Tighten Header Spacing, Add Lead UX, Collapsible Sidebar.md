## Summary
We will resolve the hydration mismatch caused by the LiveTime component, tighten the top header spacing, verify and enhance the "Add Lead" flow, and implement a collapsible/expandable sidebar with persisted state. We will also address the port conflict (EADDRINUSE) by stopping the existing server or using a different port.

## Hydration Mismatch (LiveTime)
- Root cause: SSR rendering of a Client Component that prints time (seconds tick) leads to server/client text differences.
- Fix options (we will implement both safety and best practice):
  1. Replace LiveTime usage in `src/components/layout/layout.tsx` with a dynamic import `{ ssr: false }` so it renders only on the client.
  2. Add a guarded initial render in `src/components/ui/live-time.tsx`: render a placeholder on the server and only show time after `useEffect` runs; add `suppressHydrationWarning` on the wrapping span.
- Result: No more hydration mismatch; time updates client-side only.

## Header Spacing
- Reduce padding and remove the heavy background from LiveTime to shrink its height.
- Adjust `mb-4` and container classes in `Layout` to make the header more compact.
- Keep ActivityNotification and ConnectionStatus aligned but reduce gaps.

## Add Lead Functionality
- Verify existing Create/Edit/Delete lead dialog is functional with server-side defaults and ID generation.
- Add a floating action button (FAB) on `/leads` to open the lead dialog (in addition to the header button) for quicker access.
- Ensure form validation and numeric normalization, confirm success toasts, and list refresh.

## Collapsible Sidebar (Shrink/Expand)
- Add a `collapsed` state to `Sidebar` (desktop):
  - Collapsed width `w-20` (icons only) vs expanded `w-64`.
  - Toggle button in the sidebar header; persist preference to `localStorage`.
- Update `Layout` to offset `main` content left margin based on collapsed/expanded state.
- Ensure navigation labels hide in collapsed state and show tooltips on hover.

## Port Conflict (EADDRINUSE)
- Stop the existing server on `:3000` or start on another port (`PORT=3001`).
- After changes, rebuild and start; verify `/auth` and `/leads` work without resets.

## Validation
- Build and run locally; navigate to `/leads` and header/dashboard pages.
- Confirm no hydration errors in console.
- Test create/edit/delete lead, search, filters, sort, pagination.
- Toggle sidebar collapsed/expanded; ensure layout responds smoothly and persists state.

## Deliverables
- Updated LiveTime and Layout usage (no SSR + hydration-safe rendering).
- Tightened header spacing.
- FAB for quick lead creation on `/leads`.
- Collapsible sidebar with persisted preference and layout margin updates.
- Verified local run with no client-side exceptions and resolved port conflict.

Please approve to proceed with implementation and validation.