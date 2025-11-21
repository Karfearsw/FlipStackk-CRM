## Summary
The page shows “Application error: a client-side exception” when loading localhost. Given recent Leads page changes, this is likely a runtime error in a client component (Leads, Filters, or List) from an unguarded value, event handler, or JSON fetch mismatch. I will harden the Leads page and related components, add error boundaries, and verify end-to-end.

## Diagnosis & Checks
1. Reproduce and capture the browser console stack to pinpoint the component and line.
2. Verify `/api/leads` responds with JSON and 200 when authenticated; confirm redirects are handled (401 → /auth).
3. Inspect client components for unsafe accesses and stale state usage (sorting handler, status color, map over undefined arrays).

## Implementation Changes
### Leads Page (`src/app/(dashboard)/leads/page.tsx`)
- Fix sorting toggle to avoid stale `sortBy` use:
  - Change handler to compute next order using the passed `column` instead of current state closure.
- Debounce search already implemented; retain and ensure query params are consistent (`assignedToUserId`, `createdByUserId`, `limit`, `offset`, `sortBy`, `sortOrder`).
- Add guarded pagination controls to prevent negative offsets.

### Leads List (`src/components/leads/leads-list.tsx`)
- Add safe default for status badge color:
  - Use `statusColors[lead.status] ?? 'bg-gray-500'` to avoid undefined class crashes.
- Handle error state from React Query by adding an optional `error` prop and rendering a friendly message (caller: Leads page).
- Keep sortable column headers; ensure `onSortChange` is optional and guarded.

### Lead Filters (`src/components/leads/lead-filters.tsx`)
- Guard team mapping with default `[]` to avoid mapping over undefined.
- Ensure `assignedToUserId` and `createdByUserId` propagate as numbers; reset to undefined on “All”.

### Error Boundary
- Add App Router error boundary for the dashboard segment:
  - Create `src/app/(dashboard)/error.tsx` to catch client exceptions and present a retry button.
  - Optionally add `src/app/(dashboard)/leads/error.tsx` if we want route-specific fallback.

### API Contract Verification
- Ensure `GET /api/leads` accepts and returns correct shapes for new params (`search`, `status`, `assignedToUserId`, `createdByUserId`, `sortBy`, `sortOrder`, `limit`, `offset`).
- Confirm React Query handles non-200s and that `apiGet` doesn’t crash on non-JSON error pages.

## Validation Plan
1. Build and start locally; navigate to `/leads`.
2. Exercise search, filters, sort, pagination, create/edit/delete.
3. Verify no client exceptions; confirm error boundary displays friendly fallback if any runtime error occurs.
4. Check network panel for `/api/leads` responses and status codes.

## Deliverables
- Updated Leads page and components with guard rails and stable sorting.
- Error boundary file(s) for the dashboard + leads.
- Verified local run with no client-side exceptions and full Leads CRUD flow.

Please approve to apply these changes and run validation.