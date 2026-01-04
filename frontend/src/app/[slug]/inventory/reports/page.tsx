"use client";

import { useQuery } from "@apollo/client";
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import RoleGuard from "@/components/guards/RoleGuard";
import {
    GET_INVENTORY_HEALTH_STATS,
    GET_TOP_STOCK_PRODUCTS,
    GET_CRITICAL_STOCK_PRODUCTS,
    GET_WAREHOUSE_HEALTH_SCORECARD,
    GET_MOVEMENT_TRENDS,
    GET_MOVEMENT_TYPE_BREAKDOWN,
    GET_ADJUSTMENT_TRENDS,
    GET_ADJUSTMENTS_BY_WAREHOUSE,
    GET_ADJUSTMENTS_BY_USER,
    GET_COMPANY_INVENTORY_SUMMARY,
} from "@/lib/graphql/inventory";

const COLORS = {
    ok: "hsl(var(--chart-1))",
    warning: "hsl(var(--chart-2))",
    critical: "hsl(var(--chart-3))",
    in: "hsl(var(--chart-4))",
    out: "hsl(var(--chart-5))",
};

export default function CompanyInventoryReportsPage() {
    return (
        <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory Reports</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Company-wide inventory intelligence and audit visibility
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        Read Only
                    </Badge>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="health" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="health">
                            <Activity className="h-4 w-4 mr-2" />
                            Inventory Health
                        </TabsTrigger>
                        <TabsTrigger value="warehouse">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Warehouse Comparison
                        </TabsTrigger>
                        <TabsTrigger value="flow">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Stock Flow
                        </TabsTrigger>
                        <TabsTrigger value="adjustments">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Adjustments Audit
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Inventory Health */}
                    <TabsContent value="health" className="space-y-6">
                        <InventoryHealthTab />
                    </TabsContent>

                    {/* Tab 2: Warehouse Comparison */}
                    <TabsContent value="warehouse" className="space-y-6">
                        <WarehouseComparisonTab />
                    </TabsContent>

                    {/* Tab 3: Stock Flow */}
                    <TabsContent value="flow" className="space-y-6">
                        <StockFlowTab />
                    </TabsContent>

                    {/* Tab 4: Adjustments Audit */}
                    <TabsContent value="adjustments" className="space-y-6">
                        <AdjustmentsAuditTab />
                    </TabsContent>
                </Tabs>
            </div>
        </RoleGuard>
    );
}

// ===========================
// TAB 1: INVENTORY HEALTH
// ===========================
function InventoryHealthTab() {
    const { data: healthData, loading: healthLoading } = useQuery(GET_INVENTORY_HEALTH_STATS);
    const { data: topProductsData, loading: topLoading } = useQuery(GET_TOP_STOCK_PRODUCTS, {
        variables: { limit: 10 },
    });
    const { data: criticalData, loading: criticalLoading } = useQuery(GET_CRITICAL_STOCK_PRODUCTS, {
        variables: { limit: 10 },
    });
    const { data: summaryData, loading: summaryLoading } = useQuery(GET_COMPANY_INVENTORY_SUMMARY, {
        variables: { filters: { limit: 50 } },
    });

    const healthChartData = healthData?.inventoryHealthStats
        ? [
              { name: "OK", value: healthData.inventoryHealthStats.okCount, fill: COLORS.ok },
              { name: "Warning", value: healthData.inventoryHealthStats.warningCount, fill: COLORS.warning },
              { name: "Critical", value: healthData.inventoryHealthStats.criticalCount, fill: COLORS.critical },
          ]
        : [];

    const chartConfig = {
        ok: { label: "OK", color: COLORS.ok },
        warning: { label: "Warning", color: COLORS.warning },
        critical: { label: "Critical", color: COLORS.critical },
    } satisfies ChartConfig;

    return (
        <>
            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 1. Health Distribution Donut */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Inventory Health Distribution</CardTitle>
                        <CardDescription>Product status across all warehouses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {healthLoading ? (
                            <Skeleton className="h-[200px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[200px]">
                                <PieChart>
                                    <Pie
                                        data={healthChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        dataKey="value"
                                        label
                                    >
                                        {healthChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Top Stock Holdings */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Top Stock Holding Products</CardTitle>
                        <CardDescription>Products with highest total inventory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topLoading ? (
                            <Skeleton className="h-[200px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[200px]">
                                <BarChart data={topProductsData?.topStockProducts || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="productName" type="category" width={150} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="totalQuantity" fill={COLORS.in} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 3. Critical Products Bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Critical Stock Products</CardTitle>
                    <CardDescription>Products requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                    {criticalLoading ? (
                        <Skeleton className="h-[250px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[250px]">
                            <BarChart data={criticalData?.criticalStockProducts || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="lowestWarehouseStock" fill={COLORS.critical} />
                            </BarChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Product Summary Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Inventory Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {summaryLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Total Stock</TableHead>
                                    <TableHead className="text-right">Warehouses</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryData?.companyInventorySummary?.map((item: any) => (
                                    <TableRow key={item.productId}>
                                        <TableCell className="font-medium">{item.product.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
                                        <TableCell className="text-right">{item.totalQuantity}</TableCell>
                                        <TableCell className="text-right">{item.warehouseCount}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    item.status === "OK"
                                                        ? "default"
                                                        : item.status === "WARNING"
                                                        ? "secondary"
                                                        : "destructive"
                                                }
                                            >
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

// ===========================
// TAB 2: WAREHOUSE COMPARISON
// ===========================
function WarehouseComparisonTab() {
    const { data: scorecardData, loading } = useQuery(GET_WAREHOUSE_HEALTH_SCORECARD);

    const chartConfig = {
        ok: { label: "OK", color: COLORS.ok },
        warning: { label: "Warning", color: COLORS.warning },
        critical: { label: "Critical", color: COLORS.critical },
    } satisfies ChartConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Warehouse Health Scorecard</CardTitle>
                <CardDescription>Product health status by warehouse</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                        <BarChart data={scorecardData?.warehouseHealthScorecard || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="warehouseName" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="okCount" stackId="a" fill={COLORS.ok} name="OK" />
                            <Bar dataKey="warningCount" stackId="a" fill={COLORS.warning} name="Warning" />
                            <Bar dataKey="criticalCount" stackId="a" fill={COLORS.critical} name="Critical" />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ===========================
// TAB 3: STOCK FLOW
// ===========================
function StockFlowTab() {
    const { data: trendsData, loading: trendsLoading } = useQuery(GET_MOVEMENT_TRENDS, {
        variables: { days: 30 },
    });
    const { data: breakdownData, loading: breakdownLoading } = useQuery(GET_MOVEMENT_TYPE_BREAKDOWN, {
        variables: { days: 30 },
    });

    const chartConfig = {
        in: { label: "IN", color: COLORS.in },
        out: { label: "OUT", color: COLORS.out },
    } satisfies ChartConfig;

    return (
        <>
            {/* Movement Trend Line */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Movement Trends (30 Days)</CardTitle>
                    <CardDescription>Daily stock inflow vs outflow</CardDescription>
                </CardHeader>
                <CardContent>
                    {trendsLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[300px]">
                            <LineChart data={trendsData?.movementTrends || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="inQuantity" stroke={COLORS.in} name="IN" />
                                <Line type="monotone" dataKey="outQuantity" stroke={COLORS.out} name="OUT" />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Movement Type Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Movement Type Breakdown</CardTitle>
                    <CardDescription>Distribution by movement type</CardDescription>
                </CardHeader>
                <CardContent>
                    {breakdownLoading ? (
                        <Skeleton className="h-[250px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[250px]">
                            <PieChart>
                                <Pie
                                    data={breakdownData?.movementTypeBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.type}
                                    outerRadius={80}
                                    dataKey="count"
                                >
                                    {(breakdownData?.movementTypeBreakdown || []).map((_: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                                        />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

// ===========================
// TAB 4: ADJUSTMENTS AUDIT
// ===========================
function AdjustmentsAuditTab() {
    const { data: trendsData, loading: trendsLoading } = useQuery(GET_ADJUSTMENT_TRENDS, {
        variables: { days: 30 },
    });
    const { data: warehouseData, loading: warehouseLoading } = useQuery(GET_ADJUSTMENTS_BY_WAREHOUSE, {
        variables: { days: 30 },
    });
    const { data: userData, loading: userLoading } = useQuery(GET_ADJUSTMENTS_BY_USER, {
        variables: { days: 30, limit: 10 },
    });

    const chartConfig = {
        in: { label: "Adjustment IN", color: COLORS.in },
        out: { label: "Adjustment OUT", color: COLORS.out },
    } satisfies ChartConfig;

    return (
        <>
            {/* Adjustment Trends Line */}
            <Card>
                <CardHeader>
                    <CardTitle>Adjustments Over Time (30 Days)</CardTitle>
                    <CardDescription>Manual inventory corrections</CardDescription>
                </CardHeader>
                <CardContent>
                    {trendsLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[300px]">
                            <LineChart data={trendsData?.adjustmentTrends || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="adjustmentInQuantity"
                                    stroke={COLORS.in}
                                    name="IN"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="adjustmentOutQuantity"
                                    stroke={COLORS.out}
                                    name="OUT"
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Adjustments by Warehouse */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adjustments by Warehouse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {warehouseLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[250px]">
                                <BarChart data={warehouseData?.adjustmentsByWarehouse || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="warehouseName" />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="totalAdjustments" fill={COLORS.critical} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Adjustments by User */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adjustments by User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {userLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[250px]">
                                <BarChart data={userData?.adjustmentsByUser || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="userName" />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="adjustmentCount" fill={COLORS.warning} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
