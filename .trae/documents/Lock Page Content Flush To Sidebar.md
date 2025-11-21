## Problem
The blue content area starts too far to the right. Two CSS utilities cause this: `md:pl-64` on `.page-container` and `mx-auto` on `.content-container`, which center the content and add extra left padding beyond the sidebar offset.

## Fix Plan
1. Update `src/app/globals.css` layout utilities:
   - `.page-container`: remove `md:pl-64` so there’s no extra left padding; rely on the margin set by `Layout`.
   - `.content-container`: remove `mx-auto` so the content is left-aligned; keep horizontal padding (`px-4 sm:px-6 md:px-8`) and optionally expand `max-w` if desired.
2. Keep `Layout` margin logic:
   - Collapsed: `md:ml-[5rem]` (matches `w-20`)
   - Expanded: `md:ml-[16rem]` (matches `w-64`)
3. Verify on both collapsed and expanded states that the blue area (page content) touches the sidebar without an extra gap.

## Validation
- Build and run locally.
- Toggle collapse/expand; confirm the blue area locks to the sidebar on `/leads` and other dashboard pages.
- Ensure mobile keeps `sm:ml-0` and the overlay drawer doesn’t add unintended gaps.

Please approve and I’ll apply these CSS adjustments and validate the alignment across pages.