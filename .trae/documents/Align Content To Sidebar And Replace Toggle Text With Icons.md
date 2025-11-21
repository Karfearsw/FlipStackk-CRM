## Summary
We’ll align page content exactly with the sidebar (no extra gap) and replace the collapse/expand toggle text with proper icons. We’ll also ensure collapsed mode shows icons-only for nav items with optional tooltips.

## Layout Alignment
- Change main content offset to match the actual sidebar widths:
  - Expanded: margin-left = 16rem (`w-64`).
  - Collapsed: margin-left = 5rem (`w-20`).
- Remove any extra left padding from `main-content` / `page-container` that adds gap.
- Apply responsive rules so mobile (`sm`) uses no left margin when the overlay drawer is closed.

## Sidebar Toggle Icons
- Replace «/» text with Lucide icons:
  - Collapsed → `ChevronRight` (expand).
  - Expanded → `ChevronLeft` (shrink).
- Keep button accessible (`aria-label`) and keyboard-focusable.

## Collapsed Nav Labels
- Ensure labels are hidden in collapsed mode (icons-only) and optionally show a tooltip on hover.
- Verify profile section and theme row remain hidden while collapsed.

## Validation
- Build and run locally.
- Toggle collapsed/expanded and confirm content hugs the sidebar with no extra space.
- Hover nav items to verify icons-only and (optional) tooltip.

Please approve to apply these alignment and icon changes; I’ll update the layout, sidebar, and any spacing utilities accordingly.