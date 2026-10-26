# Owner delivery dashboard — October 26, 2026

Authority: the user's approved delivery redesign plan, [V0.4 setup contract](../restaurant-setup-v04-contract.md#p12-enabled-interfaces), US12/FR07 and DEL-01. Reference: [Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience). The file retains its old notification name; its current “Redesign Delivery Dashboard” chat and preview are the delivery design used here.

## Design and integration

- `/owner/delivery` retains the existing shared header/footer, owner sidebar and active “Giao hàng VJU” navigation. Only its content is redesigned.
- The header contains the operational eyebrow, “Quản lý giao hàng”, description, configuration indicator and refresh action. Three overview cards count currently usable points, submitted proposals and delivery configuration status. These describe delivery configuration, never overall restaurant orderability.
- Desktop uses a main proposal/history column and a narrower current-configuration column. Narrow screens stack the cards; mobile keeps the existing accessible workspace drawer. The original packaged HTML is unchanged.
- Location cards use API names and native labelled checkbox semantics. Selection reveals shared labelled inputs for kilometres and integer VND, plus the existing service-enabled checkbox. Existing current rates initialize the draft; newly selected points have blank measurements and fees, never invented zeroes.
- Current rates remain readable even when disabled, unverified or attached to an unavailable point. Only active-point, enabled, verified rates count toward usable configuration. Unavailable point names fall back to their exact ID because the public point list omits inactive points.
- Proposal history renders the server's submitted/approved/rejected statuses, proposed rates, review notes and review timestamps in Asia/Ho_Chi_Minh. It shows up to the 100 rows provided by the owner policy API. No submission dates are invented or added in this scoped implementation.
- Figma Make context returned source resource links, without a screenshot or a connector resource reader. The live Make preview screenshot and App.tsx/index.css editor were inspected in Chrome. The reference uses icons rather than static image slots; the implementation composes the existing shared Icon component. No static bitmap asset or additional UI dependency is needed.

## Draft, submission and recovery

- Existing GET points, GET owner delivery-policy and keyed PUT owner delivery-policy wire contracts are unchanged. Requests stay in the feature hook; cards receive data. No backend, database, authentication or Admin workflow changes are included.
- Decimal kilometres accept dot or comma with up to three fractional digits. Integer arithmetic converts them to whole metres in 0–1,000,000; invalid precision/range is rejected without rounding. VND stays an exact canonical integer string in 0–100,000,000, with known zero distinct from blank. IDs remain strings.
- Refresh preserves the draft. Its failure keeps current data with an explicit stale warning and blocks new submission until a successful read. Confirmed new policy versions require explicit review before resubmitting the preserved draft.
- PUT creates a proposal only; current approved rates do not change while it awaits Admin approval. Turning off or omitting every previously enabled point requires a visible acknowledgement of the eventual stop-all effect.
- `useDurableCommand` retains the original key/body for unknown outcomes and reload recovery. The feature adds an immediate synchronous guard against duplicate sends. Pending intent freezes the form and exposes exact retry; it cannot be replayed against a different restaurant context.
- A definite 409 reloads authoritative state and requires explicit draft review. A failed conflict reload leaves submission blocked. A definite validation rejection retains editable inputs. Lost responses preserve recovery. A confirmed PUT followed by failed GET remains acknowledged, with a read-only retry rather than a new uncertain write.
- Expired/forbidden/missing-resource responses remove displayed policy/history and drafts. Component state is keyed to actor and restaurant; obsolete reads cannot populate another context.
- Shared request feedback supplies floating success/error cards. Inline feedback preserves durable recovery and stale-data context. Loading, no points, no policy, no proposals, field errors and failed reads have explicit states.

## Visual adaptations and accessibility

Keep the packaged Be Vietnam Pro, semantic cream/orange/status colors and shared icons. Reference panel radius, spacing, shadows, selectable-card treatment and short motion are adapted inside `owner-delivery.css`; unrelated chrome/tokens are unchanged. Larger readable labels and 44px controls replace the prototype's unusually small text. The operational enabled switch, stop-all acknowledgement and recovery/conflict controls remain visible even though the prototype simplifies them.

Focus outlines, associated errors, keyboard checkboxes and validation focus are supported. Long Vietnamese names wrap. Reduced motion disables page-specific animations/transitions. There is no map, driver management, fee estimator, fake approval, mock data in application code, migration or deployment.

## Verification

- PASS: `npm --prefix frontend run lint` (no warnings).
- PASS: `npm --prefix frontend run build`; existing main-chunk size advisory remains.
- PASS: `npm --prefix frontend run test:delivery-unit` — 3 DEL-01 cases covering exact decimal conversion/limits, blank versus zero VND, payload/ID preservation and usable-rate filtering.
- PASS: `npm --prefix frontend run test:delivery-ui` — real isolated Chrome with controlled frontend API responses: 360/390/768/1024/1440px, long names, desktop columns, empty/loading/error/forbidden states, keyboard selection/input focus, validation, zero fee, draft-preserving refresh, duplicate sends, lost response and reload recovery, review-gated 409, definite 422, confirmed PUT plus failed GET, stop-all, zoom200% and reduced motion.
- Desktop configured/empty and mobile empty screenshots were visually compared with the Make preview. Browser output reports its temporary evidence directory; it contains no retained user data.
- `frontend/scripts/browser-delivery.mjs` is updated for the new labels and explicit km/fee inputs. Connected `npm --prefix frontend run test:delivery`: **NOT RUN**, disposable `TEST_DATABASE_URL` **NOT CONFIGURED**. The UI suite does not establish backend persistence, transactional races or real Admin approval.

Self-review only. Existing unrelated homepage/avatar work is preserved. No retained data was modified and no release acceptance is implied.
