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
    ChartLegend,
    ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList, Sector } from "recharts";
import { type PieSectorDataItem } from "recharts/types/polar/Pie";
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
import { StockHealthBadge } from "@/components/inventory/stock-health-badge";

const COLORS = {
    ok: "#3b82f6", // Standard blue
    warning: "#60a5fa", // Lighter blue
    critical: "#1e40af", // Darker blue
    in: "#3b82f6",
    out: "#ef4444",
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
        // Add mappings for specific data keys to ensure tooltips pick up the right color
        lowestWarehouseStock: { label: "Stock", color: COLORS.ok },
        totalQuantity: { label: "Quantity", color: COLORS.ok },
        totalAdjustments: { label: "Adjustments", color: COLORS.ok },
        adjustmentCount: { label: "Count", color: COLORS.ok },
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
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={healthChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        strokeWidth={5}
                                        activeIndex={0}
                                        activeShape={({
                                            outerRadius = 0,
                                            ...props
                                        }: PieSectorDataItem) => (
                                            <Sector {...props} outerRadius={outerRadius + 10} />
                                        )}
                                    >
                                        {healthChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
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
                                <BarChart
                                    accessibilityLayer
                                    data={topProductsData?.topStockProducts || []}
                                    layout="vertical"
                                    margin={{
                                        left: -20,
                                    }}
                                >
                                    <XAxis type="number" dataKey="totalQuantity" hide />
                                    <YAxis
                                        dataKey="productName"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value.slice(0, 10) + (value.length > 10 ? '...' : '')}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="totalQuantity" fill={COLORS.in} radius={5}>
                                        <LabelList dataKey="totalQuantity" position="right" />
                                    </Bar>
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
                            <BarChart
                                accessibilityLayer
                                data={criticalData?.criticalStockProducts || []}
                                margin={{
                                    top: 20,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="productName"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 10)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                    <Bar dataKey="lowestWarehouseStock" fill={COLORS.ok} radius={8}>
                                        <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                                    </Bar>
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
                                    <TableHead className="text-right">Usable Stock</TableHead>
                                    <TableHead>Stock Health</TableHead>
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
                                        <TableCell className="text-right font-medium text-green-600">
                                            {item.usableQuantity?.toFixed(2) || '0.00'}
                                        </TableCell>
                                        <TableCell>
                                            <StockHealthBadge 
                                                state={item.stockHealthState} 
                                                recommendation={item.stockHealthState === 'HEALTHY' ? 'Stock is healthy' : 'Action may be required'} 
                                            />
                                        </TableCell>
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
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart accessibilityLayer data={scorecardData?.warehouseHealthScorecard || []}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="warehouseName"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value}
                            />
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                                dataKey="okCount"
                                stackId="a"
                                fill={COLORS.in}
                                radius={[0, 0, 4, 4]}
                            />
                            <Bar
                                dataKey="warningCount"
                                stackId="a"
                                fill={COLORS.warning}
                                radius={[0, 0, 0, 0]}
                            />
                             <Bar
                                dataKey="criticalCount"
                                stackId="a"
                                fill={COLORS.critical}
                                radius={[4, 4, 0, 0]}
                            />
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
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={breakdownData?.movementTypeBreakdown || []}
                                    dataKey="count"
                                    nameKey="type"
                                    innerRadius={60}
                                    strokeWidth={5}
                                    activeIndex={0}
                                    activeShape={({
                                        outerRadius = 0,
                                        ...props
                                    }: PieSectorDataItem) => (
                                        <Sector {...props} outerRadius={outerRadius + 10} />
                                    )}
                                >
                                    {(breakdownData?.movementTypeBreakdown || []).map((_: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={[
                                                "#3b82f6", // Standard
                                                "#60a5fa", // Light
                                                "#2563eb", // Dark
                                                "#93c5fd", // Lighter
                                                "#1d4ed8", // Darker
                                            ][index % 5]}
                                        />
                                    ))}
                                </Pie>
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
                                <LineChart
                                    accessibilityLayer
                                    data={trendsData?.adjustmentTrends || []}
                                    margin={{
                                        top: 20,
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.slice(0, 5)}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="line" />}
                                    />
                                    <Line
                                        dataKey="adjustmentInQuantity"
                                        type="natural"
                                        stroke={COLORS.in}
                                        strokeWidth={2}
                                        dot={{
                                            fill: COLORS.in,
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                        name="IN"
                                    >
                                        <LabelList
                                            position="top"
                                            offset={12}
                                            className="fill-foreground"
                                            fontSize={12}
                                        />
                                    </Line>
                                    <Line
                                        dataKey="adjustmentOutQuantity"
                                        type="natural"
                                        stroke={COLORS.out}
                                        strokeWidth={2}
                                        dot={{
                                            fill: COLORS.out,
                                        }}
                                        activeDot={{
                                            r: 6,
                                        }}
                                        name="OUT"
                                    >
                                        <LabelList
                                            position="top"
                                            offset={12}
                                            className="fill-foreground"
                                            fontSize={12}
                                        />
                                    </Line>
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
                            <BarChart
                                accessibilityLayer
                                data={warehouseData?.adjustmentsByWarehouse || []}
                                margin={{
                                    top: 20,
                                }}
                            >
                                <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="warehouseName"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="totalAdjustments" fill={COLORS.ok} radius={8}>
                                        <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Adjustments by User */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adjustments by User</CardTitle>
                        <CardDescription>User activity breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {userLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[250px]">
                                <BarChart
                                    accessibilityLayer
                                    data={userData?.adjustmentsByUser || []}
                                    margin={{
                                        top: 20,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="userName"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickFormatter={(value) => value}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="adjustmentCount" fill={COLORS.ok} radius={8}>
                                        <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
