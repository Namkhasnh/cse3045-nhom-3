# Target Code Structure

This tree is placement guidance derived from [architecture §10](architecture.md), **not an inventory of implemented files**. Inspect current source before creating a feature. The [documentation map](README.md) summarizes the actual scaffold and documentation status.

Keep the existing `frontend/` and `backend/` package roots. Add only the files needed for the assigned scope; do not generate empty feature/module shells or post-V1.0 folders merely to match this tree. Documentation paths below already exist; most business-code paths are proposed.

```text
cse3045-nhom-3/
├── AGENTS.md                             # AI task routing and repository rules
├── docs/
│   ├── README.md                         # Documentation index and status
│   ├── requirements.md                   # Source of requirements
│   ├── architecture.md                   # Responsibilities and dependencies
│   ├── code_structure.md                 # This target tree
│   ├── data/
│   │   ├── database.md                   # Schema, constraints, migrations
│   │   └── api_contract.md               # Endpoints, DTOs, errors
│   ├── ui/
│   │   ├── ui_convertion.md              # UI conversion and design rules
│   │   └── Hoa Lac Food Ordering Platform.html  # Original reference
│   ├── ai_integration.md                 # AI boundaries and validation
│   ├── development_guide.md              # Development conventions
│   ├── testing.md                        # Tests and acceptance criteria
│   └── deployment.md                     # Operations, backup/restore
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                       # Mount providers and router; no large screens
│   │   ├── app/
│   │   │   ├── router.tsx                # Routes and role-aware navigation
│   │   │   ├── providers.tsx             # Session, cart, server state if needed
│   │   │   ├── layouts/
│   │   │   │   ├── StudentLayout.tsx
│   │   │   │   ├── OwnerLayout.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── pages/                    # Compose multiple features into a page
│   │   │   │   ├── RestaurantDetailPage.tsx
│   │   │   │   └── CheckoutPage.tsx
│   │   │   └── hooks/
│   │   │       └── useCheckout.ts        # Coordinate cart, delivery, orders via public APIs
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── restaurants/
│   │   │   ├── dishes/
│   │   │   │   ├── pages/                # Owner dish-management pages
│   │   │   │   ├── components/           # DishCard, DishList, DishForm, DishFilters
│   │   │   │   ├── hooks/                # useDishes, useDishEditor
│   │   │   │   ├── api/                  # dishes.api.ts
│   │   │   │   ├── types.ts              # Feature UI types
│   │   │   │   └── index.ts              # Public exports
│   │   │   ├── delivery/                 # Pickup point selection, quote display
│   │   │   ├── cart/                     # Purchase-intent draft
│   │   │   ├── orders/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── OrderTrackingPage.tsx
│   │   │   │   │   └── OwnerOrdersPage.tsx
│   │   │   │   ├── components/
│   │   │   │   │   ├── OrderCard.tsx
│   │   │   │   │   ├── OrderItemList.tsx
│   │   │   │   │   ├── OrderSummary.tsx
│   │   │   │   │   ├── OrderStatusBadge.tsx
│   │   │   │   │   ├── OrderTimeline.tsx
│   │   │   │   │   └── OrderActions.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useOrder.ts
│   │   │   │   │   ├── useOrderPolling.ts
│   │   │   │   │   ├── useCreateOrder.ts
│   │   │   │   │   └── useOrderActions.ts
│   │   │   │   ├── api/
│   │   │   │   │   └── orders.api.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   ├── payments/                 # Display payment state and submit confirmations
│   │   │   ├── vouchers/                 # Scoped voucher management and API hooks
│   │   │   ├── commissions/              # Basic manual reconciliation
│   │   │   ├── recommendations/
│   │   │   └── support/                  # V0.7/V1.0; reviews/favorites V1.1
│   │   ├── shared/
│   │   │   ├── api/                      # HTTP client, API errors, contract DTOs
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── ErrorState.tsx
│   │   │   ├── hooks/                    # Generic hooks without feature dependencies
│   │   │   └── lib/                      # Display utilities, no monetary business rules
│   │   ├── assets/
│   │   └── index.css                     # Tailwind theme, font imports and current UI styles
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── validation.pipe.ts
│   │   ├── http/                         # Transport; calls workflows only
│   │   │   ├── http.module.ts
│   │   │   ├── controllers/              # Grouped by accounts, orders, payments, etc.
│   │   │   └── dto/
│   │   ├── workflows/                    # Coordination, permissions, transactions
│   │   │   ├── workflows.module.ts
│   │   │   ├── order.workflow.ts
│   │   │   ├── payment.workflow.ts
│   │   │   ├── recommendation.workflow.ts
│   │   │   ├── restaurant-admin.workflow.ts
│   │   │   └── settlement.workflow.ts
│   │   ├── modules/
│   │   │   ├── accounts/                 # Ordinary identity, sole Admin/MFA, user availability
│   │   │   ├── onboarding/               # V0.3 applications, terms and review history
│   │   │   ├── restaurants/
│   │   │   ├── dishes/
│   │   │   ├── delivery/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── commissions/
│   │   │   ├── recommendations/
│   │   │   ├── audit/
│   │   │   ├── media/                    # If image uploads are enabled
│   │   │   └── support/                  # V0.7/V1.0; reviews/favorites V1.1
│   │   ├── integrations/
│   │   │   ├── ai/                       # Adapter implementing AiGateway
│   │   │   ├── maps/                     # After V1.0: RouteDistancePort
│   │   │   └── storage/                  # If needed: ImageStoragePort
│   │   ├── prisma/                       # Existing DB infrastructure; add transactions
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   ├── database.config.ts
│   │   │   ├── db-check.ts
│   │   │   └── transaction-manager.ts
│   │   ├── common/                       # Shared infrastructure only
│   │   │   ├── security/                 # Guards, CSRF, rate limiting
│   │   │   ├── errors/
│   │   │   └── observability/
│   │   └── generated/prisma/             # Generated; do not edit manually
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/                             # Integration/e2e and race tests on MySQL
│   ├── prisma7.config.ts                 # Keep the configuration filename in the source
│   ├── .env.example                      # No real secrets
│   ├── package.json
│   └── package-lock.json
└── .github/workflows/ci.yml              # Existing package checks
```

## Placement rules

- [Architecture §§3–4, 10.1–10.2](architecture.md) defines module/data ownership, allowed calls, frontend composition and backend module internals.
- [Development §§7–10](development_guide.md) defines coding conventions; [AGENTS.md](../AGENTS.md) maps each task to the detailed contracts to read first.
- Keep single-feature UI in its feature; coordinate features in app composition through public exports. Shared code must not import features.
- Coordinate business modules in workflows; repositories access only their owning module's data using the supplied transaction context.
- Generated Prisma code and build/test outputs are never implementation locations.
- The tree does not select routing/state libraries, providers, auth lifecycle details or future feature contracts. Resolve the relevant documented TBDs before enabling those capabilities.

## Commercial additions and status

[Roadmap](roadmap.md) owns version delivery; [implementation status](implementation-status.md) is the actual inventory. Add frontend onboarding application/terms/history/review under its feature; app composition preserves buyer navigation alongside the single managed restaurant. accounts owns MFA/authority and availability; onboarding owns submissions/terms/reviews; restaurants owns unique ownership/readiness. Workflows coordinate atomic approval/manual create through public services with account-first locks. Support/audit administration is required V0.7, QR/refunds V0.6, media P13; maps V1.2, reorder/random/reviews/favorites V1.1.

The documentation tree now includes roadmap.md, decisions.md, implementation-status.md, documentation-verification.md, onboarding.md, account-security.md, payments-policy.md, release-checklist.md, data/migration-plan.md and prompts/README.md plus v0.1.md–v1.0.md. These are documentation paths; proposed source folders are not claimed present.

Checkout/voucher extension: `backend/src/modules/vouchers` owns definitions/redemptions through `public.ts`; the HTTP/application layer composes it with orders, delivery and commissions. Frontend voucher requests/state live in its hook and presentation remains in `VouchersPage`. See [approved contract](checkout-vouchers.md).
