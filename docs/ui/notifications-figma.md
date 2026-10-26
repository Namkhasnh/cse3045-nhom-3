# Standalone notification center — October 24, 2026

Authority: user's approved implementation plan and explicit clarification that notifications belong on a separate page. Sources: [latest Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience), [notification contract](../notifications-contract.md), US27/FR13/AC18 and NOTIFY-01/02.

## Design mapping

The Figma connector returns Make source resource links, but resource reads and Make screenshots were unavailable through that connector. Chrome inspection successfully read the current preview and its App.tsx/index.css editor. Latest Make revision removes the account sidebar and centers content at 960px. The original packaged HTML reference remains unchanged.

- `/notifications` is a standalone authenticated page with the existing header/footer, no personal/owner/Admin workspace sidebar. The personal sidebar no longer lists the mailbox. Existing direct links, including the legacy workspace query, still resolve to this page; authorization remains server-side.
- Page introduction: “Thông báo của bạn”, subtitle, shared unread total. Segmented All/Unread/Read and category controls; full-mailbox read-all, refresh and cursor load-more.
- Day headings use Asia/Ho_Chi_Minh: Hôm nay, Hôm qua, Trước đó. Cards share title/body/time/category icon/action/read indicator with the recent dropdown. Read cards use less emphasis; unread cards have a subtle warm surface and accent.
- Desktop popover is 410px wide, up to 535px high within viewport, with fixed header/footer and internal scrolling. Mobile uses a bottom sheet with backdrop/close control. Opening never marks messages read.
- Open/close fades and translates in 200ms; Escape, outside pointer, keyboard focus, reduced motion and touch controls are supported. Confirmed read updates remove indicators; pending operations disable duplicate writes.
- Loading skeletons, filtered-empty/mailbox-empty states and explicit errors with retry use real API state. Existing snapshots/checklists remain accessible in details where authorized.

## Adaptation boundary

Keep the project's Be Vietnam Pro and semantic color/icon system. Do not adopt prototype Manrope, its mock users/order records or its fake navigation toast. The shared header and unrelated account/owner/Admin pages are not redesigned. Icons compose the existing shared Icon component; no new UI framework or animation package is installed. Order links resolve from trusted server metadata and current resources; messages without a destination open their own details.

No new table/migration, destructive update, seed, external provider or deployment is part of this change. Existing notification rows and generation semantics are retained. See [actual checks and limitations](../notifications-verification.md).

## Incoming alerts extension — October 24

The user's subsequent approved plan adds a compact top-right popup below the shared header and an optional local chime. This is an extension to the existing design, not a change to the Figma source. The [notification contract](../notifications-contract.md#incoming-popup-and-optional-sound--october-24) owns detection, defaults, account/browser preferences, audio activation and read semantics. Popup and sound switches live in the bell panel; popups pause on hover/focus and respect reduced motion. The detail action uses existing authorized routes. Desktop width is at most 380px; mobile margins are 12px. No imagery, prototype data or new design identity is introduced.

## Shared floating viewport — October 25

The user's subsequent approved consolidation replaces the separate incoming-popup presentation with the action-feedback card, positioned top-right below navigation. See [shared behavior](action-feedback.md#unified-floating-messages--october-25-2026). Both sources share one viewport, two visible cards and a waiting queue. Incoming detail/retry, complete copy, burst links, preferences, sound and mailbox semantics remain. The former380px popup-specific styles are removed; the shared width is at most400px with12px mobile margins.
