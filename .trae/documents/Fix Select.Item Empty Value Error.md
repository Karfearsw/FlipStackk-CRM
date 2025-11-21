## Summary
The console error comes from a Select item that uses an empty string ("") as its value. In Shadcn Select, items must have a non-empty string value; use a sentinel like "none" and map it to undefined.

## Changes
1) Lead Dialog (assignedTo select):
- File: `src/components/leads/lead-dialog.tsx`
- Replace `<SelectItem value="">Unassigned</SelectItem>` with `<SelectItem value="none">Unassigned</SelectItem>`.
- Change the Select `value` to be `undefined` when no selection: `value={field.value ? field.value.toString() : undefined}`.
- Update `onValueChange` to map `none` → `undefined`, else parseInt: `onValueChange={(v)=> field.onChange(v === 'none' ? undefined : parseInt(v))}`.

2) Audit other Selects:
- Lead Filters: keep "all" as the non-empty sentinel; no change needed.
- Page size Select: values are "10","25","50"; no change needed.

## Validation
- Build and reload `/leads` and the dialog.
- Confirm the console error disappears and Unassigned selection works.

Please approve and I’ll apply the changes and verify.