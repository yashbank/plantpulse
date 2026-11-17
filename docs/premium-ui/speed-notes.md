# Speed notes (server/data side)

Constraint driving everything: Prisma on the Supabase session pooler with max 1 connection per instance, so
queries in one request run one after another. Fewer queries beat more parallelism. No output was changed.

## Implemented

### 1. `getFactoryTimezone()` memoised per request (`src/server/mis/business-rules.ts`)
- Was: every call = 2 queries (`ensureFactoryDefaults` findFirst + `getRuleValue` findFirst). The dashboard called it
  from the page, production, scrap-rate, QC, on-time and PO widgets; attendance from the page plus
  `listAttendance`, `getMonthSummary` and others.
- Now: wrapped in React `cache()` (same pattern as `getCurrentUser` and `getMisRole`). One resolution per request.
- Output-identical: the rule is effective-dated and read with `now`; within one request the answer is the same. The
  only write (`ensureFactoryDefaults` seeding) still happens exactly once, on first call.
- Gain: roughly 8-10 serial round trips removed on the dashboard (~25-40 ms each on the pooler, so ~200-400 ms
  server time at full layout), ~4 on attendance.
- Risk: a server action that changes the timezone rule and then reads it again in the same request would see the
  old value. `updateBusinessRule` reads it only before writing and the page re-renders in a new request. Low.
- Proof: `cache()` is a pass-through outside React server rendering, so all existing tests exercise the same code
  path unchanged.

### 2. One production-log query for output + scrap-rate (`src/server/mis/range-metrics.ts`)
- `getRangeProduction` and `getRangeScrapRate` ran the same `misProductionLog.findMany` (same range, same filter)
  with different selects. Now both call one `cache()`d `fetchRangeLogs(fromKey, toKey, tz)` with the union select.
- Output-identical: each reader still reads only the fields it read before; rows are never mutated.
- Gain: one heavy range query (the largest on the dashboard, plus a join) saved when the scrap-trend widget is placed.
- Proof: `src/server/mis/range-metrics-speed.test.ts` (memoising `cache` stand-in): one DB call for both readers,
  results equal to two independent reads.

### 3. Dashboard page: timezone and `searchParams` resolved in the first `Promise.all`
- Previously `await searchParams` and `await getFactoryTimezone()` ran after the layout/catalogue await. Now all four
  resolve together. Same values, one fewer serial step. (`src/app/(mis)/mis/dashboard/page.tsx`)

### 4. `attendance/loading.tsx` added
- Same skeleton as employees/po lists. Shown while the register resolves; no effect on final output.

## Already fine (checked)
- `getCurrentUser` and `getMisRole` are already React-`cache()`d; `requirePermission` therefore costs no queries
  after the first call. No duplicate auth lookups to remove.
- production/po/employees pages already batch their independent queries in `Promise.all`.
- No chart library or client-side xlsx in the bundle: charts are hand-made SVG; `xlsx` is imported only by
  `api/mis/inventory/import/route.ts` (server). `next.config` already lists `lucide-react` in
  `optimizePackageImports`; Next 16 already optimises `date-fns` by default.

## Deliberately skipped (and why)
- **Suspense streaming of dashboard widgets**: needs `DashboardScreen`/`widgets.tsx` to accept promises or be split
  per widget; those are presentational files owned by the UI agents. Suggested follow-up: make each widget body an
  async server component under its own `<Suspense>`, so the first widgets paint while slow ones load.
- **`unstable_cache` / `use cache` for business rules, masters, shifts, departments**: not done. Mutations call
  `revalidatePath`, not `revalidateTag`, and rule reads are effective-dated against `new Date()`. Adding a tag cache
  would need a `revalidateTag` in every master/rule/shift/department mutation; unsure all write paths are covered,
  so not cached. Candidates when someone owns that audit: `listShifts`, `listDepts`, `listOptions('UNIT')`,
  `getFactoryTimezone` (cross-request, tag `business-rules`).
- **`dynamic()` import of the dashboard customise panel / SlideOver bodies**: lives in presentational client files.
  Estimated 8-20 KB gzip of first-load JS on dashboard and orders; not measured, no build run.
- **Employees page**: `listEmployeesPage` and `listEmployees` both load employees (the second is the full D4-scoped
  roll for the manager picker). Merging changes scoping code; skipped. Could derive the page slice from the full list.
- **`getRangeQc` open-defect query** reads every non-voided PASS/FAIL check of all time. Suggest computing in SQL
  (latest per order/stage/parameter) - output-identical but needs raw SQL and its own test; skipped.
- **`getLowStockAlerts` ledger query** (`DISTINCT ON (item_id)` over the whole ledger) is the heaviest widget query.

## Index suggestions (documentation only; no migration created or applied)
Verify with `EXPLAIN` first, and check which already exist in `prisma/schema.prisma`.
- `mis_inventory_ledger (item_id, created_at DESC)` - serves the low-stock `DISTINCT ON`.
- `mis_production_logs (logged_at) WHERE voided_at IS NULL` - range queries on dashboard/reports.
- `mis_qc_checks (check_time)` and `(order_id, bom_stage_id, parameter_name, check_time)` - range and open-defect scans.
- `mis_orders (delivery_date)` - on-time widget.
- `mis_attendance (date)` - register/day summaries (may be covered by a unique `(employee_id, date)`: that does not
  help a date-only filter).

## Not measured
No live timing was taken; gains above are counted round trips, not stopwatch results.
