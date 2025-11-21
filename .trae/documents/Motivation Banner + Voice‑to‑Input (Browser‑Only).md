## Motivation Banner
- Add a new client component `MotivationBanner` that cycles through images with fade/slide transitions.
- Place images under `public/motivation/` (use the 5 you provided). Example: `motivation/flip-stackk-1.jpg` … `flip-stackk-5.jpg`.
- Features:
  - Auto‑rotate every 6–8 seconds; pause on hover; manual prev/next; keyboard accessible.
  - Responsive (full‑width, max height ~220–280px), dark/light overlay for legibility, alt text for accessibility.
- Integration:
  - Render at the top of `src/app/(dashboard)/dashboard/page.tsx` inside the header area (just below LiveTime row), so it feels motivational on entry.

## Voice‑to‑Input (Free, No Server)
- Implement `useSpeechInput` hook using the **Web Speech API** (works in Chrome/Edge desktop/mobile). No backend calls; free and open.
- Create `MicButton` control that:
  - Detects support; requests mic permission; start/stop; shows recording state; writes transcript into a bound input.
  - Language configurable (default `en-US`). Graceful fallback if unsupported.
- Integration targets (non‑breaking):
  - Leads page search box (quick voice search).
  - Lead Dialog notes field (dictate notes).
  - Calls scheduling/logging notes field.
- Optional later: Add an open‑source offline fallback (Vosk WASM) behind a feature flag if you want cross‑browser coverage.

## Files to Add/Update (minimal)
- `src/components/dashboard/motivation-banner.tsx` (new component)
- `src/hooks/use-speech-input.ts` (hook)
- `src/components/ui/mic-button.tsx` (button control)
- Update pages to inject banner and mic buttons without altering existing logic.

## Validation
- Ensure banner cycles, is accessible, and doesn’t shift layout.
- Confirm voice dictation fills inputs; verify fallback messaging when unsupported.

## Notes
- No external paid services; browser‑only solution keeps the app self‑contained.
- All changes are additive and isolated to components/hooks to avoid breaking flows.

Please confirm and I’ll implement the banner and voice‑to‑input with the images you provided, keeping everything lightweight and free.