# Floventry — Monetization Plan

> Company-level subscription model — when a company upgrades, all members get the features.

---

## Tier Overview

| | Free | Standard | Pro |
|---|---|---|---|
| **Price** | ₹0 | ₹1,499/mo | ₹3,499/mo |
| **SKUs** | 100 | 500 | Unlimited |
| **Warehouses** | 1 | 3 | Unlimited |
| **Team members** | 2 | 5 | Unlimited |
| **Suppliers** | 10 | 50 | Unlimited |

---

## Guiding Principles

1. **Never gate inventory correctness** — stock, lots, expiry blocking, FEFO, warehouse operations, and basic reports stay free.
2. **Free enables a full basic workflow** — product → stock → issue → transfer → reports.
3. **Standard unlocks** automation, exports, notifications, and moderate intelligence.
4. **Pro unlocks** advanced analytics, advanced automation, advanced alerts, advanced settings, and integrations.
5. **RBAC roles are never gated** — all four roles (OWNER, ADMIN, MANAGER, STAFF) work on every tier.
6. **Company creation is never gated.**

---

## Feature Matrix

### Core (Always Free)

These features must remain available on **every** tier to preserve inventory correctness and safety.

| Feature | Module / Resolver |
|---|---|
| Product / Category / Unit CRUD | `InventoryModule` — `ProductResolver`, `CategoryResolver`, `UnitResolver` |
| Stock operations (create, adjust, opening stock) | `InventoryModule` — `StockResolver` |
| Stock lot tracking (FIFO/FEFO with expiry) | `InventoryModule` — stock lots |
| Expired-stock blocking | Expiry scanner (fixed 30-day window) |
| GRN lifecycle (create → post → cancel) | `InventoryModule` — `GRNResolver` |
| Issue notes with FEFO auto-lot-selection | `IssuesModule` — `IssuesResolver` |
| Warehouse transfers | `InventoryModule` — `TransferResolver` |
| Purchase order lifecycle | `PurchaseOrdersModule` — `PurchaseOrdersResolver` |
| Sales order lifecycle | `SalesModule` — `SalesResolver` |
| Per-warehouse stock health view | `StockHealthResolver` — `warehouseStockHealth` |
| Low stock monitoring (WARNING / CRITICAL) | `LowStockResolver` — `lowStockItems` |
| Stock threshold management | `LowStockResolver` — `updateStockThresholds` |
| In-app notifications (expired, expiring, GRN posted, issue posted, transfer completed) | `NotificationsModule` |
| Expiry scanner — daily cron, fixed 30-day window (always runs, never gated) | `ExpiryScannerModule` |
| Dashboard — KPIs, alerts, stock status, expiry risk, warehouse health, movements | `CompanyDashboardModule` — `companyDashboard` query |
| Warehouse reports (overview, movements, stock health, adjustments) | Frontend report components |
| Global search | `GlobalSearchModule` |
| RBAC (all 4 roles) | `RoleModule`, `AuthGuard`, `RolesGuard` |
| Company creation & onboarding | `CompanyModule` |
| Manual barcode entry + barcode lookup | `productByBarcode` query |
| Supplier CRUD (within limit) | `SupplierModule` |
| CSV import — products only (within SKU limit) | `ImportModule` (partial) |

### Standard Tier

| Feature | Module / Resolver | Gate Location |
|---|---|---|
| Multi-warehouse (up to 3) | `WarehouseModule` | `createWarehouse` mutation |
| Team members (up to 5) | `InviteModule` | `sendInvite` mutation |
| SKU limit raised to 500 | `InventoryModule` | `createProduct` mutation |
| Supplier limit raised to 50 | `SupplierModule` | `createSupplier` mutation |
| CSV imports — all types (products, categories, suppliers, opening stock) | `ImportResolver` | All import mutations |
| Import template downloads | `ImportResolver` | Template mutations |
| Warehouse-level CSV exports (snapshot, movements, adjustments, expiry lots) | `ExportResolver` | `exportStockSnapshot`, `exportStockMovements`, `exportAdjustments`, `exportExpiryLots` |
| Barcode label PDF generation | `BarcodeLabelResolver` | `generateBarcodeLabels` |
| Company sequential barcode generation | `ProductResolver` | `generateCompanyBarcode` |
| Alternate barcodes (product barcode units) | `ProductResolver` | `upsertProductBarcodeUnit` |
| Barcode history tracking | `ProductResolver` | `barcodeHistory` query |
| All 14 notification types + real-time subscriptions | `NotificationsResolver` | Already available |
| Notification preferences | Settings page | UI only |
| Manual expiry scan trigger | `ExpiryScannerResolver` | `triggerExpiryScan` |
| Expiry scan status monitoring | `ExpiryScannerResolver` | `expiryScanStatus` |
| Company overview report (KPIs + alerts + pies) | Frontend `OverviewReport` | UI gate |
| Company movements report | Frontend `InventoryMovementsReport` | UI gate |
| Inventory health tab | Frontend inventory reports | UI gate |
| Point of sale page (inventory-first system — POS is an add-on, not core) | Frontend POS route | UI gate |

### Pro Tier

| Feature | Module / Resolver | Gate Location |
|---|---|---|
| Unlimited warehouses, members, SKUs, suppliers | Various | Create mutations + `PlanLimitsService` |
| Custom expiry warning window (configurable days) | `CompanyResolver` | `updateCompanySettings` — validate `expiry_warning_days ≠ 30` |
| Company-level CSV exports (inventory summary, company movements, expiry risk) | `ExportResolver` | `exportInventorySummary`, `exportCompanyMovements`, `exportExpiryRisk` |
| Advanced company reports (stock health, adjustments, PO, SO) | Frontend report tabs | UI gate |
| Advanced inventory analytics (warehouse comparison, stock flow, adjustments audit) | Frontend inventory report tabs | UI gate |
| Expiry risk report (full risk score page) | Frontend expiry report page | UI gate |
| Audit log access (full trail, filters, cursor pagination) | `AuditLogResolver` | `companyAuditLogs`, `auditLogsConnection` |
| Audit settings | Frontend audit settings page | UI gate |
| Company-level analytics (summary, health, trends, stats) | `StockResolver` | `companyInventorySummary`, `companyInventoryHealth`, `averageMovementRate`, `inventoryAdjustmentTrends`, `criticalStockProducts`, `reorderPoints` |
| Company-level stock health | `StockHealthResolver` | `companyStockHealth` |
| Company-level issue notes view | `IssuesResolver` | `issueNotesByCompany` |
| Company stats | `CompanyResolver` | `companyStats` |
| ZPL thermal label generation (Zebra / TSC) | Thermal label service / REST | Endpoint gate |
| Company barcode settings (prefix, padding, suffix) | `CompanyResolver` | `updateCompanyBarcodeSettings` |
| Advanced company settings (`allow_negative_stock`, `stock_valuation_method`, `restrict_manager_catalog`, `stock_costing_method`) | `CompanyResolver` | `updateCompanySettings` — field-level |

---

## Implementation Guide

### Existing Infrastructure

The codebase already has a plan-gating pattern in place:

| File | Purpose |
|---|---|
| `backend/src/company/company-settings.entity.ts` | `is_premium: boolean` column (default `false`) |
| `backend/src/company/company-settings.model.ts` | `is_premium` exposed via GraphQL |
| `frontend/src/hooks/usePlanTier.ts` | `usePlanTier()` hook — currently hardcoded to `isPro: true` |
| `frontend/src/components/upgrade/UpgradeModal.tsx` | Reusable upgrade prompt modal |
| `frontend/src/app/[slug]/settings/billing/page.tsx` | Billing settings with plan comparison |
| `frontend/src/app/[slug]/settings/components/InventorySettingsForm.tsx` | First implemented feature gate (expiry warning days disabled on Standard) |

### Step 1 — Upgrade the plan field

Replace `is_premium: boolean` with a proper enum on `CompanySettings`:

```ts
// company-settings.entity.ts
@Column({ type: 'enum', enum: ['FREE', 'STANDARD', 'PRO'], default: 'FREE' })
plan: 'FREE' | 'STANDARD' | 'PRO';
```

### Step 2 — Create a backend plan guard

Follow the existing `RolesGuard` / `@Roles()` pattern.

```
backend/src/auth/guards/plan.guard.ts      → PlanGuard (reads company settings, compares plan)
backend/src/auth/decorators/plan.decorator.ts → @RequiresPlan('STANDARD') / @RequiresPlan('PRO')
```

Usage on a resolver:

```ts
@UseGuards(AuthGuard, RolesGuard, PlanGuard)
@Roles(Role.OWNER, Role.ADMIN)
@RequiresPlan('PRO')
@Mutation(() => String)
exportInventorySummary(...) { ... }
```

### Step 3 — Create a plan limits service

```
backend/src/auth/plan-limits.service.ts → PlanLimitsService
```

Called inside create mutations to enforce resource caps:

```ts
await this.planLimits.assertCanCreate('warehouse', companyId);
// throws ForbiddenException('Warehouse limit reached for your plan')
```

### Step 4 — Update the frontend hook

Make `usePlanTier()` read the actual `plan` field from company settings:

```ts
// usePlanTier.ts
return {
  plan: data?.companyBySlug?.settings?.plan ?? 'FREE',
  isPro: plan === 'PRO',
  isStandard: plan === 'STANDARD' || plan === 'PRO',
  loading,
};
```

### Step 5 — Gate frontend features

Use the existing pattern from `InventorySettingsForm.tsx`:

```tsx
const { isPro, isStandard } = usePlanTier();

// Disable a button
<Button disabled={!isStandard} onClick={...}>
  {!isStandard && <Crown className="h-4 w-4 mr-1" />}
  Export CSV
</Button>

// Show upgrade modal
{showUpgrade && <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />}
```

---

## Backend Gate Locations (Quick Reference)

| Resolver File | Method | Minimum Plan |
|---|---|---|
| `export/export.resolver.ts` | `exportStockSnapshot` | Standard |
| `export/export.resolver.ts` | `exportStockMovements` | Standard |
| `export/export.resolver.ts` | `exportAdjustments` | Standard |
| `export/export.resolver.ts` | `exportExpiryLots` | Standard |
| `export/export.resolver.ts` | `exportInventorySummary` | Pro |
| `export/export.resolver.ts` | `exportCompanyMovements` | Pro |
| `export/export.resolver.ts` | `exportExpiryRisk` | Pro |
| `audit/audit-log.resolver.ts` | `companyAuditLogs` | Pro |
| `audit/audit-log.resolver.ts` | `auditLogsConnection` | Pro |
| `expiry-scanner/expiry-scanner.resolver.ts` | `triggerExpiryScan` | Standard |
| `expiry-scanner/expiry-scanner.resolver.ts` | `expiryScanStatus` | Standard |
| `company-dashboard/company-dashboard.resolver.ts` | `companyDashboard` | **Free** |
| `inventory/barcode/barcode-label.resolver.ts` | `generateBarcodeLabels` | Standard |
| `inventory/inventory.resolver.ts` | `companyInventorySummary` | Pro |
| `inventory/inventory.resolver.ts` | `companyInventoryHealth` | Pro |
| `inventory/inventory.resolver.ts` | `averageMovementRate` | Pro |
| `inventory/inventory.resolver.ts` | `inventoryAdjustmentTrends` | Pro |
| `inventory/inventory.resolver.ts` | `criticalStockProducts` | Pro |
| `inventory/inventory.resolver.ts` | `reorderPoints` | Pro |
| `inventory/stock-health/stock-health.resolver.ts` | `companyStockHealth` | Pro |
| `issues/issues.resolver.ts` | `issueNotesByCompany` | Pro |
| `company/company.resolver.ts` | `updateCompanySettings` (advanced fields) | Pro |
| `company/company.resolver.ts` | `updateCompanyBarcodeSettings` | Pro |
| `company/company.resolver.ts` | `companyStats` | Pro |

---

## Frontend Gate Locations (Quick Reference)

| Page / Component | Gate | Minimum Plan |
|---|---|---|
| `app/[slug]/dashboard` | No gate — full dashboard is free (visibility, not intelligence) | **Free** |
| Warehouse reports (overview, movements, health, adjustments) | No gate | **Free** |
| `components/export/ExportButton.tsx` | Disable warehouse exports | Standard |
| `components/export/ExportButton.tsx` | Disable company exports | Pro |
| `app/[slug]/audit-log/` | Show upgrade prompt | Pro |
| `app/[slug]/reports/page.tsx` | Disable Stock Health / Adjustments / PO / SO tabs | Pro |
| `app/[slug]/inventory/reports/page.tsx` | Disable Warehouse Comparison / Stock Flow / Adjustments Audit tabs | Pro |
| `app/[slug]/inventory/reports/expiry/page.tsx` | Gate entire page | Pro |
| `app/[slug]/settings/components/InventorySettingsForm.tsx` | Custom expiry days (already gated) | Pro |
| `app/[slug]/settings/audit/` | Gate page | Pro |
| Warehouse creation form | Show limit (1 / 3 / unlimited) | Tier-based |
| Invite / team settings | Show member limit (2 / 5 / unlimited) | Tier-based |
| Supplier creation | Show count warning | Tier-based |
| Product creation | Show SKU limit warning | Tier-based |

---

## Refined Tier Summary

### Free

- 1 warehouse, 2 users, 100 SKUs, 10 suppliers
- Full stock workflow (product → stock → issue → transfer)
- Expiry scanner (daily cron, fixed 30-day window — always runs)
- In-app notifications
- Dashboard (KPIs, alerts, stock status, expiry risk, warehouse health, movements)
- Warehouse reports (overview, movements, stock health, adjustments)
- Manual barcode entry + lookup
- Basic CSV import (products only)
- Global search
- RBAC (all 4 roles)

### Standard

- 3 warehouses, 5 users, 500 SKUs, 50 suppliers
- All CSV imports (products, categories, suppliers, opening stock)
- All warehouse-level CSV exports
- PDF barcode labels + sequential barcode generation
- Company overview report + movements report
- Inventory health tab
- Manual expiry scan trigger + scan status
- Notification preferences
- Point of sale

### Pro

- Unlimited warehouses, users, SKUs, suppliers
- Custom expiry warning window
- Company-level CSV exports (inventory summary, company movements, expiry risk)
- Audit log (full trail, filters, cursor pagination)
- Company-level analytics (summary, health, trends, stats)
- Advanced company reports (stock health, adjustments, PO, SO)
- Advanced inventory analytics (warehouse comparison, stock flow, adjustments audit)
- Expiry risk report
- ZPL thermal labels (Zebra / TSC)
- Company barcode settings
- Advanced company settings
- Future: email alerts, webhooks, scheduled reports, API access

---

## Future Monetization Ideas

Based on existing code infrastructure — not yet implemented, but architecturally ready:

| Idea | Existing Infrastructure | Suggested Tier |
|---|---|---|
| Email notifications (expiry alerts, digests) | `EmailModule` with `sendEmail()` + `NotificationsService` events | Pro |
| Webhook integrations | `PubSubModule` real-time events | Pro |
| Scheduled reports (weekly email summaries) | `ScheduleModule` + `ExportService` + `EmailService` | Pro |
| Excel / PDF export formats | Frontend has `xlsx` + `jsPDF`; backend has `pdfkit` | Standard (Excel) / Pro (PDF) |
| Advanced barcode formats (QR, DataMatrix) | `bwip-js` supports 100+ types | Pro |
| Product image attachments | AWS S3 SDK installed | Standard |
| Custom notification rules | Typed notification events in `NotificationsService` | Pro |
| Dashboard PDF snapshot | `jsPDF` + Recharts available | Pro |
| Rate-limited API access | Auth guards infrastructure | Pro |
