# Student Discovery Preview — Verification

Date: October 16, 2026. Scope: presentation-only discovery for US02/US03, FR02, BR05/08/10 display boundaries and NFR06. Relevant target cases: CAT-01 and UI-02 in [testing.md](../testing.md). These checks do not establish connected discovery, delivery eligibility or full MVP acceptance.

## Automated checks

| Check | Result |
| --- | --- |
| `npm --prefix frontend run lint` | PASS — Oxlint |
| `npm --prefix frontend run build` | PASS — TypeScript and Vite production build |
| One-off Node.js assertions against actual TypeScript fixture/filter/formatter modules | PASS — 26 assertions covering prefixes, whitespace/case, NFC normalization, preserved diacritics, combined same-dish filters, inactive/hidden exclusion, visible sold-out discovery, price boundaries and exact large VND formatting |
| Contrast calculation from the actual theme colors | PASS — 10 text/background pairs, all at least 4.5:1; minimum 4.65:1 for white on brand |
| Frontend unit/component/browser regression suites | NOT CONFIGURED — no runner added |
| Backend/database checks | NOT RUN — unchanged and outside this presentation-only task |

Boundary assertions include `29999`, `30000`, `50000`, `50001` and `9007199254740993`; the latter formats exactly as `9.007.199.254.740.993đ`. No ID or money string is converted to Number. These one-off assertions are not a persistent CI suite.

## Browser observations

Checked in native Google Chrome on macOS against the local Vite development server. Screenshots and accessibility-tree observations were inspected during the session; this is manual evidence, not browser E2E automation or a pixel-diff baseline.

| Scenario | Result / evidence |
| --- | --- |
| 360 px | PASS — single-column cards, wrapping filters, no visible horizontal overflow; measured viewport/document widths both 360 px |
| 390 px reference width | PASS — single column, long restaurant name wraps, missing/broken images retain their frame; measured viewport/document widths both 390 px |
| 768 px | PASS — two columns, measured `352px 352px`, viewport/document widths both 768 px |
| 1024 px | PASS — three columns, measured `312px 312px 312px`, viewport/document widths both 1024 px |
| Fixed navigation | PASS — measured 94 px navigation and 170 px content bottom padding at normal zoom; final card/footer remain reachable above it |
| Name search | PASS — `  cƠm  ` returns Cơm Gà Bà Tư; filter state remains visible |
| Combined category/price | PASS — the same quán's 15.000đ drink does not satisfy Cơm below 30.000đ; 30.000–50.000đ restores its matching rice dish |
| Reset/no-match | PASS — zero results has a clear-filter action; reset restores six active fixture restaurants |
| Delivery and unavailable states | PASS — known `0đ`, unknown fee, closed and temporarily paused are distinct text labels; no ordering action exists |
| Missing and invalid image | PASS — both display the labeled image fallback without collapsing the card; the deliberately invalid data URI can produce an expected image-resource error in DevTools |
| Simulated loading/empty/error | PASS — separate labels and presentations; loading exposes an accessible label, empty dataset differs from filtered no-match |
| Error retry | PASS — restores fixture cards, retains the entered Bánh query and selected price range, removes the error preview parameter |
| Keyboard/focus | PASS — Tab reaches the visible skip link; Enter skips to main; Tab/Space select filter chips with visible focus and updated pressed state; disabled navigation is identified in the accessibility tree |
| Vietnamese font | PASS — Be Vietnam Pro rendered Vietnamese copy; browser font check reports loaded |
| Reduced motion | PASS — DevTools emulation reports `prefers-reduced-motion: reduce` true and skeleton `animationName: none`; emulation restored afterward |
| Browser zoom 200% | PASS — header, filters and cards reflow; long name/fees/footer remain readable and reachable above navigation; zoom restored afterward |

## Source inspection and limits

- `App` imports the restaurant feature through its public entrypoint. Shared code has no upward imports or requests; fixture data stays in its explicit feature boundary.
- UI uses semantic tokens, native controls, a labeled input, pressed filter chips, decorative SVG icons and text-bearing status badges. Read-only cards are not fake links.
- Development state selection is guarded by `import.meta.env.DEV`. Production build state-parameter behavior is source-inspected, not browser-tested.
- Large monetary formatting was verified by Node assertions. Browser stress rendering of a maximum-size fee: NOT RUN; the regular fixture amounts were browser-observed. This is not financial validation.
- Owner/Admin layouts and automated accessibility suites: NOT CONFIGURED. Full screen-reader audit, physical mobile devices and other browser engines: NOT RUN.
- No authenticated API, database constraints, live hours, real delivery quote, order creation, payment or performance target was tested or claimed.

See the [frontend guide](../../frontend/README.md) for commands, preview URLs and component props, and [UI §8.4](ui_convertion.md#84-implemented-student-discovery-preview) for intentional reference adaptations.
