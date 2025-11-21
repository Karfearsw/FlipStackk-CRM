## Goal
Use your provided brand image in the sidebar header when collapsed; show the FlipStackk text when expanded.

## Implementation
- Place the image in `public/flipstackk-mark.png` (or `.jpg` as supplied).
- Update `src/components/layout/sidebar.tsx`:
  - Import `next/image` and conditionally render `Image src="/flipstackk-mark.png" width={28} height={28}` when `collapsed` is true.
  - Keep the existing FlipStackk text when expanded.
  - Ensure proper alt text and alignment.
- Optional: Add a small fallback (initials) if the image is missing.

## Validation
- Collapse/expand the sidebar and confirm the image appears in collapsed mode and text appears in expanded mode.

Please approve and I’ll wire the image into the collapsed header with safe fallbacks.