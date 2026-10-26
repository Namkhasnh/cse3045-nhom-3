# Figma Login redesign — October 26, 2026

Authority: the user's approved implementation plan for the complete `/login` page. Reference: [Figma Make Login](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience?preview-route=%2Flogin). The supplied link contained `/owner/settings`; the user explicitly selected the Login screen and its full header/footer. This is a presentation change under [UI conventions](ui_convertion.md), US01/FR01 and [account security](../account-security.md).

## Approved presentation

- Login alone uses Be Vietnam Pro, cream `#fff9f4`, orange `#e63e19`, dark orange `#ca3415`, peach accents and the reference's soft shadows. The existing identity remains on other routes.
- Desktop card: maximum 1120px, columns 1.08/.92, minimum 620px height, 32px corners. Tablet uses .88/1.12 columns; at 620px and below the 210px food hero sits above the form.
- The exact reference food photo is stored at `frontend/public/images/auth/login-rice.jpg`, with the You Le / Unsplash credit. Source: `https://images.unsplash.com/photo-1766050587783-1c90751275dd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400`. It is decorative food photography, not a real partner/menu record. Failed image loading uses the existing Photo fallback.
- Three CSS steam trails cover 300×220px, rise/fade over 3.4 seconds with staggered phases, and scale to 72% on mobile. The reference's image zoom, floating badge, sparkle, waving emoji, staggered entrance, focus lift, button sheen and logo hover motion are retained. Reduced motion disables animation and transitions.
- Existing SiteHeader owns real search/cart/navigation, disclosure Escape/focus/outside-click behavior and return-path links. Login supplies scoped appearance and the matching compact light footer. Unsupported prototype `/foods`, `/restaurants` listing and `/help` links map to existing homepage anchors and `/support`.

## Integration and intentional differences

`AuthPage` retains its API calls and username/password validation, errors, request timeout, MFA/recovery and navigation callbacks. The shared Input accepts optional icon/trailing slots; callers without slots retain the original input DOM. Password visibility is a local toggle with accessible state and a non-submit button. No animation library or new runtime dependency is needed.

The prototype simulates login and removes email verification. This implementation keeps real authentication, email verification/resend, recovery and Admin MFA. Compact assistance links remain below signup and may make the desktop card taller than the prototype. Registration and verification keep their existing presentation; no API, schema, session or consent policy changes are introduced. Guest baskets and safe `returnTo` navigation remain intact; login never creates an order.

The Figma connector returned Make source links but its resource reads and Make screenshot tools were unavailable. The current preview and original `App.tsx`/`index.css` were inspected directly in Chrome, including the latest 300px-wide steam revision. The packaged original HTML remains unchanged.

## Verification

- `npm --prefix frontend run lint` and `npm --prefix frontend run build`: PASS; the existing large-bundle warning remains.
- `npm --prefix frontend run test:smoke`: PASS; offline homepage/preview and login/registration/verification at 360px.
- `npm --prefix frontend run test:login`: PASS at 360/390/768/1024/1440px; local photo/landmark/card geometry, keyboard/menu, actual image hover zoom/button sheen/input focus, password toggle, pending/invalid/offline states, MFA/recovery, normal and MFA return paths, guest-basket preservation, no order writes, signup/verification isolation, reduced motion and zoom. API responses are controlled test fixtures.
- `npm --prefix frontend run test:homepage`: PASS across seven widths and guest/buyer/owner/Admin shell states, auth routes, empty/error states, keyboard, reduced motion and zoom; controlled API responses.
- Visual observation: original Figma preview and local desktop Chrome were compared directly; screenshots at all five planned widths were inspected for photo crop, layout, text wrapping and controls.
- Connected real-backend authentication/database checks: NOT RUN for this frontend-only change. Controlled browser responses establish UI behavior and outgoing payloads, not real credentials, persistence or security enforcement.

Existing browser scripts now wait for the redesigned welcome heading (`Chào mừng bạn trở lại!`); this copy change alone does not claim those connected suites have been rerun.

## Autofill and entry-focus refinement — October 26

The user's follow-up screenshot identified Chrome's blue autofill paint inside the cream input wrappers. Login now covers autofill paint using the wrapper's own surface (warm off-white at rest, white on focus), preserving normal password-manager autocomplete and readable text/caret. This is a scoped input-color correction, not a page palette change.

Opening Login automatically focuses the username input; Tab continues to the password. Registration/verification do not acquire autofocus, and the existing MFA input still receives focus when its challenge opens. The technical username `title` tooltip is omitted on Login; validation and the registration format guidance remain.

The Login Chrome suite checks entry focus across all five widths, Tab order and a forced Chrome autofill pseudo-state without reading or storing credentials. This controlled state checks CSS rendering, not an actual saved-password integration.
