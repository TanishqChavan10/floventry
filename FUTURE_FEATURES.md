# Flowventory — Future / Deferred Features

This document tracks **intentionally deferred** features that are tempting to add, but are **out of scope for now**.

**Goal:** keep the product stable, auditable, and easy to operate while the core inventory workflows mature.

## Guiding principles for deferring

- **Avoid state coupling:** features that create new cross-module state (inventory ↔ sales ↔ purchasing) raise the risk of inconsistent stock.
- **Human-in-control:** automation must not silently create orders or change stock without clear operator intent.
- **Auditability first:** any feature that complicates “who changed what, when, and why” needs strong event logging and traceability.
- **Ship the boring core:** receiving (GRN), issuing (Issue Notes), transfers, expiry/FEFO, adjustments, reporting, and permissions must remain reliable.

## Deferred feature table

| Feature | Why tempting | Why not now |
| --- | --- | --- |
| Reservations / Allocations | Sales accuracy | Adds complex state coupling |
| Batch pricing / valuation | Accounting appeal | Needs accounting model |
| Serial numbers | Electronics use cases | Explodes UI + logic |
| Mobile scanning app | Ops speed | Backend already sufficient |
| Custom roles | Enterprise asks | RBAC already adequate |
| Auto-reorder | “Smart” feel | Violates human-in-control |

---

## 1) Reservations / Allocations

**What it is**
- The ability to “hold” inventory for a specific sales order/customer/channel so it can’t be consumed by other operations.

**Why it’s tempting**
- Prevents overselling.
- Gives sales teams stronger confidence in available stock.

**Why not now (core risk)**
- Introduces tightly coupled state across sales orders, stock lots, transfers, GRNs, and adjustments.
- Requires defining how reservations behave under:
  - partial fulfilment,
  - cancellations/returns,
  - transfers between warehouses,
  - expiry/FEFO rules,
  - negative stock policy.

**If we revisit later, we must define**
- A single source of truth: reserved quantities tracked per stock lot vs per product vs per warehouse.
- Conflict resolution rules when stock changes (adjustments, expiry, transfers).
- Clear audit events: reserve, release, consume, expire-reservation.

## 2) Batch pricing / valuation

**What it is**
- Track inventory value over time (e.g., weighted average cost, FIFO/LIFO, batch/lot cost) and reflect it in reports.

**Why it’s tempting**
- Makes the system useful for accounting discussions and margin analysis.

**Why not now (core gap)**
- Needs a consistent accounting model and policies:
  - valuation method,
  - currency handling,
  - cost roll-ups across transfers and returns,
  - reconciliation rules.
- Without that, the numbers will look “precise” but be misleading.

**If we revisit later, we must define**
- Valuation policy per company (or global).
- How GRN cost, adjustments, shrinkage, and transfers affect valuation.
- Reports that reconcile movements to closing value.

## 3) Serial numbers

**What it is**
- Track individual serialized units (IMEI/serial) from receipt to issue.

**Why it’s tempting**
- Essential for certain verticals (electronics, warranty tracking, regulated goods).

**Why not now (blast radius)**
- Multiplies complexity across UI, imports, reports, and all stock movement flows.
- Forces per-unit operations (scan/verify/issue) instead of bulk quantities.

**If we revisit later, we must define**
- Serial capture points (GRN, transfer-in, adjustments).
- Serial lifecycle states (in stock, reserved, issued, returned, scrapped).
- Import/export formats and scanning UX patterns.

## 4) Mobile scanning app

**What it is**
- A dedicated iOS/Android app for barcode-driven workflows (receiving, picking, cycle counts).

**Why it’s tempting**
- Faster operations on the floor; better camera scanning.

**Why not now**
- Significant product surface area (offline, device auth, camera permissions, sync, app store releases).
- Current backend + web UI can support scanning workflows without introducing mobile operational overhead.

**If we revisit later, we must define**
- Supported workflows (receiving, issue, transfer, counts) and offline requirements.
- Device/session security model.
- Sync conflict strategy (especially if offline).

## 5) Custom roles

**What it is**
- Admins define arbitrary roles and permissions (custom RBAC).

**Why it’s tempting**
- Common enterprise request; fits diverse org structures.

**Why not now**
- Current role set is adequate for the current scope.
- Custom RBAC adds:
  - permission matrix UI,
  - migration/versioning of permissions,
  - risk of misconfiguration leading to support burden.

**If we revisit later, we must define**
- Permission primitives (per action, per module, per warehouse).
- Role templates vs fully custom.
- Safe defaults and “lockout prevention” for admins.

## 6) Auto-reorder

**What it is**
- Automatically create purchase orders when stock drops below thresholds.

**Why it’s tempting**
- Makes the system feel “smart” and reduces manual work.

**Why not now**
- Violates **human-in-control**: auto-created POs can be wrong due to seasonality, promotions, supplier lead times, cash flow, or temporary stock anomalies.
- Requires reliable demand forecasting inputs and vendor constraints.

**If we revisit later, we must define**
- A recommendation-first approach:
  - generate suggested reorder lists,
  - require explicit approval to create POs.
- Supplier constraints (MOQ, pack sizes, lead time).
- Audit events for recommendation generation and approvals.

---

## How to propose adding a deferred feature

1. Add a short design note: **problem statement**, **users impacted**, **success metrics**.
2. List required data model changes and new invariants (what must always remain true).
3. Define audit events and failure modes.
4. Provide a minimal rollout plan (feature flag, migration, backfill, training).
