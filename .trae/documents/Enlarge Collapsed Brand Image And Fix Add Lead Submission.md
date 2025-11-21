## Overview
You reported two issues:
1) Collapsed sidebar image is still too small.
2) Adding a lead isn’t working.

## Fix Plan
### 1) Collapsed Brand Image Size
- Update `src/components/layout/sidebar.tsx` to increase the collapsed brand image to 56×56 (or match avatar at 40×40 if you prefer). We’ll also ensure the header’s height accommodates the image without clipping.
- Keep object-fit (`object-contain`) and consistent margins so the icon aligns vertically.

### 2) Make “Add Lead” Work Reliably
- The client-side Zod schema in `src/components/leads/lead-dialog.tsx` currently requires `city`, `state`, `zip`, and `ownerName`. If left blank, submission fails before reaching the server.
- Align the client validation with server defaults to allow quick entry:
  - Keep `propertyAddress` required.
  - Make `city`, `state`, `zip`, `ownerName` optional (or provide sensible defaults on submit).
  - Maintain enums for `status`, `propertyType`, and `source` but default them to valid values.
- On submit, normalize and fill missing fields with server-friendly defaults (e.g., “pending”, “00000”) to match what the `/api/leads` route already handles.
- Improve error feedback:
  - Show exact validation messages next to fields.
  - Surface server errors via toast with the returned message.

### 3) Validation & UX Enhancements
- Add a small helper below the “Add Lead” button indicating the only required field is address.
- Keep the existing debounce search and filters intact; no changes needed there.

## Verification
- Build and run locally.
- Collapse/expand the sidebar and verify the brand image size looks correct.
- Open Add Lead, leave optional fields blank, enter an address, and submit.
- Confirm a new lead appears in the table and toasts show success.

## Optional Tuning
- If you want the brand image to match the avatar exactly, we’ll set both to the same size (e.g., 48×48) and make the avatar circular (`rounded-full`).

Please approve, and I’ll apply these changes and validate end-to-end.