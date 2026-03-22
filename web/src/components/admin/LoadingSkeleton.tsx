/* ─────────────────────────────────────────────────────────
   Premium Loading Skeletons  –  Admin Panel
   ───────────────────────────────────────────────────────── */

/* Base shimmer bone */
function Bone({ className = '' }: { className?: string }) {
    return <div className={`skeleton-bone ${className}`} />;
}

/* ── Reusable filter bar ── */
function FilterBarSkeleton() {
    return (
        <div className="flex flex-wrap gap-3">
            <Bone className="h-9 flex-1 min-w-48 rounded-lg" />
            <Bone className="h-9 w-32 rounded-lg" />
            <Bone className="h-9 w-28 rounded-lg" />
        </div>
    );
}

/* ── Reusable table ── */
function TableRowsSkeleton({ rows = 7, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            {/* header */}
            <div className="border-b bg-gray-50 px-6 py-3.5 flex gap-6">
                {Array.from({ length: cols }).map((_, i) => (
                    <Bone key={i} className={`h-2.5 rounded ${i === 0 ? 'w-24' : 'flex-1'}`} />
                ))}
            </div>
            {/* rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="border-b last:border-0 px-6 py-4 flex items-center gap-6"
                    style={{ opacity: 1 - i * 0.08 }}
                >
                    <div className="flex items-center gap-3 w-40 shrink-0">
                        <Bone className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <Bone className="h-3 w-full" />
                            <Bone className="h-2 w-3/4" />
                        </div>
                    </div>
                    {Array.from({ length: cols - 2 }).map((_, j) => (
                        <Bone key={j} className="h-3 flex-1" />
                    ))}
                    <Bone className="h-7 w-20 rounded-full shrink-0" />
                </div>
            ))}
        </div>
    );
}

/* ── Stat cards row ── */
function StatCardsSkeleton({ count, gridClass }: { count: number; gridClass: string }) {
    return (
        <div className={`grid gap-4 ${gridClass}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-5 shadow-sm flex items-center gap-4">
                    <Bone className="h-11 w-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Bone className="h-2.5 w-20" />
                        <Bone className="h-7 w-14" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   EXPORTED SKELETONS
   ══════════════════════════════════════════════════════════ */

/** Stats + filter bar + data table — used by most admin pages */
export function PageSkeleton({
    statCount = 4,
    statGridClass = 'sm:grid-cols-2 lg:grid-cols-4',
    tableRows = 7,
    tableCols = 6,
}: {
    statCount?: number;
    statGridClass?: string;
    tableRows?: number;
    tableCols?: number;
}) {
    return (
        <div className="space-y-6">
            <StatCardsSkeleton count={statCount} gridClass={statGridClass} />
            <FilterBarSkeleton />
            <TableRowsSkeleton rows={tableRows} cols={tableCols} />
        </div>
    );
}

/** Dashboard: stat cards grid + section cards */
export function DashboardSkeleton() {
    return (
        <div className="space-y-10">
            {/* KPI cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <Bone className="h-2.5 w-28" />
                            <Bone className="h-9 w-9 rounded-full" />
                        </div>
                        <Bone className="h-8 w-24" />
                        <Bone className="h-2 w-36" />
                    </div>
                ))}
            </div>
            {/* Section cards */}
            <div className="grid gap-6 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm space-y-4">
                        <Bone className="h-4 w-32" />
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex items-center gap-3">
                                <Bone className="h-9 w-9 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Bone className="h-3 w-32" />
                                    <Bone className="h-2 w-24" />
                                </div>
                                <Bone className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Analytics: 12-card metric grid */
export function AnalyticsSkeleton() {
    return (
        <div className="space-y-8">
            {/* header */}
            <div className="space-y-2">
                <Bone className="h-7 w-56" />
                <Bone className="h-3 w-64" />
            </div>
            {/* metric cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm space-y-3" style={{ opacity: 1 - i * 0.04 }}>
                        <div className="flex items-start justify-between">
                            <Bone className="h-2.5 w-28" />
                            <Bone className="h-9 w-9 rounded-full" />
                        </div>
                        <Bone className="h-8 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Emergency centers: card grid */
export function EmergencyCentersSkeleton() {
    return (
        <div className="space-y-6">
            {/* header + button */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Bone className="h-7 w-52" />
                    <Bone className="h-3 w-72" />
                </div>
                <Bone className="h-10 w-40 rounded-lg" />
            </div>
            {/* filter bar */}
            <FilterBarSkeleton />
            {/* cards grid */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white p-5 shadow-sm space-y-4" style={{ opacity: 1 - i * 0.1 }}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <Bone className="h-4 w-48" />
                                <Bone className="h-5 w-28 rounded-full" />
                            </div>
                            <Bone className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Bone className="h-3 w-full" />
                            <Bone className="h-3 w-3/4" />
                            <Bone className="h-3 w-1/2" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {Array.from({ length: 3 }).map((_, j) => (
                                <Bone key={j} className="h-5 w-20 rounded-full" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Full-page auth loading (used in admin layout) */
export function LayoutLoadingScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 gap-6">
            {/* Animated ring */}
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-green-200" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 animate-spin" />
                {/* inner dot */}
                <div className="absolute inset-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
            </div>
            <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-green-800 tracking-wide">Lakwedha Admin</p>
                <p className="text-xs text-gray-400">Verifying your session…</p>
            </div>
        </div>
    );
}
