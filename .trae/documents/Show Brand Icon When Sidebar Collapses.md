## Goal
When the sidebar is collapsed, replace the "FlipStackk" header text with a compact brand icon; when expanded, show the text.

## Implementation Plan
1. Update `src/components/layout/sidebar.tsx` header area:
   - Conditionally render based on `collapsed` prop:
     - Expanded: `<h1 className="text-lg font-bold text-primary">FlipStackk</h1>`
     - Collapsed: inline SVG brand mark component (`<BrandMark />`) sized ~24–28px; no text.
   - Keep the chevron toggle button as-is.
2. Add a small inline brand SVG (no new files required):
   - Define `function BrandMark()` inside `sidebar.tsx` returning a red house/arrow monogram styled to match FlipStackk branding.
   - Use Tailwind classes to match dark/light themes.
3. Spacing and alignment:
   - Ensure the header row `p-4` keeps the icon vertically centered.
   - Collapse state keeps consistent width (`w-20`) with icon centered and no text overflow.

## Validation
- Collapse/expand the sidebar and verify:
  - Collapsed: only icon appears; no extra spacing.
  - Expanded: text appears; layout unchanged.

Please approve and I’ll implement the conditional rendering with an inline brand icon.