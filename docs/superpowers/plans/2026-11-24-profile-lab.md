# Living personal lab README

## Approved direction

English profile for Mello: curiosity, programming, AI and open source. Large editorial typography, electric blue, neutral light/dark themes, an abstract animated code-and-connections hero. Activity follows the hero. No named projects. Compact technology summary and existing contact destinations remain.

## Implementation

- [x] Update `scripts/build-v5.mjs` and README composition. Reuse the existing SVG generator, brand assets and theme variants rather than introducing a site framework or external badge service.
- [x] Add monthly contribution rendering, retaining the authenticated GitHub fetch and existing streak calculation. Store only calendar counts/dates and retrieval time for reproducible offline rendering. Test empty months, year boundaries and future-date exclusion.
- [x] Update profile checks, daily workflow and local preview for the new assets and responsive sources. Keep all data fetching read-only; no push or publication.
- [x] Generate assets, run Node tests and XML/reference checks, then inspect light/dark desktop/mobile previews in a real browser. Serve localhost for the owner.

## Local verification

Nine Node tests passed. Reference validation found all 20 responsive SVG sources; XML validation passed for all 142 assets. Chromium loaded all five visible images without horizontal overflow at 1280, 390 and 320 pixels, in both themes. Desktop/mobile screenshots were visually inspected. Remote GitHub rendering and the scheduled Action remain unexecuted for this change.

Hero CSS animation was verified in Chromium: `signal` normally, `none` with reduced motion. The preview is served at `http://127.0.0.1:8765/previews/profile.html`. Automatic Chrome launch was rejected by policy, and native browser control was unavailable; the owner must open the URL manually.

## Validation focus

Missing API data must fail without replacing valid graphics. Empty months must render zero bars. SVG animations must respect reduced motion. Mobile variants must remain readable. Local preview is an approximation of GitHub, and remote rendering/Actions must not be claimed as validated.
