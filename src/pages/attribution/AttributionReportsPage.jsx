import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { toast } from "react-toastify";
import {
  getAttributionReport,
  getAttributionSummary,
  getCustomerSources,
} from "../../core/apis/attributionAPI";
import Filters from "../../Components/Filters/Filters";
import CustomDatePicker from "../../Components/CustomDatePicker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// ─── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({ title, value, subtitle, loading, color = "primary" }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ textAlign: "center", py: 3 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width="60%" sx={{ mx: "auto" }} />
            <Skeleton variant="text" width="40%" sx={{ mx: "auto" }} />
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AttributionReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [reportData, setReportData] = useState([]);
  const [sources, setSources] = useState([]);

  // Filters
  const [groupBy, setGroupBy] = useState("month");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [sourceId, setSourceId] = useState("");

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    groupBy: "month",
    dateFrom: null,
    dateTo: null,
    sourceId: "",
  });

  // ── Fetch summary (once) ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [summaryRes, sourcesRes] = await Promise.all([
        getAttributionSummary(),
        getCustomerSources(),
      ]);
      if (!summaryRes.error) setSummary(summaryRes.data || {});
      if (!sourcesRes.error) setSources(sourcesRes.data || []);
    })();
  }, []);

  // ── Fetch report data ─────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAttributionReport({
        groupBy: appliedFilters.groupBy,
        dateFrom: appliedFilters.dateFrom
          ? appliedFilters.dateFrom.toISOString().split("T")[0]
          : null,
        dateTo: appliedFilters.dateTo
          ? appliedFilters.dateTo.toISOString().split("T")[0]
          : null,
        sourceId: appliedFilters.sourceId || null,
      });
      if (result.error) {
        toast.error(result.error);
        setReportData([]);
      } else {
        setReportData(result.data || []);
      }
    } catch (e) {
      toast.error("Failed to load report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const applyFilter = () => {
    setAppliedFilters({ groupBy, dateFrom, dateTo, sourceId });
  };

  const resetFilters = () => {
    setGroupBy("month");
    setDateFrom(null);
    setDateTo(null);
    setSourceId("");
    setAppliedFilters({
      groupBy: "month",
      dateFrom: null,
      dateTo: null,
      sourceId: "",
    });
  };

  // ── Flatten sources for dropdown ──────────────────────────────────────────
  const flatSources = [];
  (sources || []).forEach((s) => {
    flatSources.push({ id: s.id, name: s.name });
    if (s.sub_sources) {
      s.sub_sources.forEach((sub) => {
        flatSources.push({ id: sub.id, name: `  └ ${sub.name}` });
      });
    }
  });

  // ── Aggregate chart data (group by period, stack by source) ───────────────
  const periods = [...new Set(reportData.map((r) => r.period))].sort();
  const sourceNames = [
    ...new Set(reportData.map((r) => r.source_name)),
  ].filter(Boolean);

  const chartColors = [
    "#667eea", "#48bb78", "#ed8936", "#e53e3e", "#9f7aea",
    "#38b2ac", "#dd6b20", "#3182ce", "#d53f8c", "#718096",
  ];

  const chartData = {
    labels: periods,
    datasets: sourceNames.map((name, i) => ({
      label: name,
      data: periods.map((p) => {
        const row = reportData.find(
          (r) => r.period === p && r.source_name === name
        );
        return row ? Number(row.total_revenue || 0) : 0;
      }),
      backgroundColor: chartColors[i % chartColors.length],
      borderRadius: 3,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
        ticks: {
          callback: (v) => `€${v.toLocaleString()}`,
        },
      },
    },
  };

  // ── Aggregate totals per source for summary table ─────────────────────────
  const sourceTotals = {};
  reportData.forEach((r) => {
    const key = r.source_name || "Unknown";
    if (!sourceTotals[key]) {
      sourceTotals[key] = { customers: 0, orders: 0, revenue: 0 };
    }
    sourceTotals[key].customers += Number(r.customer_count || 0);
    sourceTotals[key].orders += Number(r.total_orders || 0);
    sourceTotals[key].revenue += Number(r.total_revenue || 0);
  });

  const sortedSourceTotals = Object.entries(sourceTotals).sort(
    (a, b) => b[1].revenue - a[1].revenue
  );

  const fmt = (n) => `€${Number(n || 0).toFixed(2)}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Total Attributed"
            value={summary.total_attributed ?? "—"}
            loading={!Object.keys(summary).length}
            color="success"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Unattributed"
            value={summary.total_unattributed ?? "—"}
            loading={!Object.keys(summary).length}
            color="warning"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Top Source (Customers)"
            value={summary.top_source_by_customers || "—"}
            subtitle={
              summary.top_source_customer_count
                ? `${summary.top_source_customer_count} customers`
                : ""
            }
            loading={!Object.keys(summary).length}
            color="primary"
          />
        </Grid>
        <Grid item size={{ xs: 6, sm: 3 }}>
          <SummaryCard
            title="Top Source (Revenue)"
            value={summary.top_source_by_revenue || "—"}
            subtitle={
              summary.top_source_revenue
                ? fmt(summary.top_source_revenue)
                : ""
            }
            loading={!Object.keys(summary).length}
            color="info"
          />
        </Grid>
      </Grid>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="page-card">
        <Filters onReset={resetFilters} onApply={applyFilter} applyDisable={false}>
          <Grid container size={{ xs: 12 }} spacing={2} alignItems="center">
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  Group By
                </Typography>
                <ToggleButtonGroup
                  value={groupBy}
                  exclusive
                  onChange={(_, v) => { if (v) setGroupBy(v); }}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="month">Month</ToggleButton>
                  <ToggleButton value="year">Year</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <CustomDatePicker
                  label="From Date"
                  value={dateFrom}
                  onChange={(d) => setDateFrom(d)}
                  placeholder="From"
                  maxDate={dateTo || new Date()}
                />
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <CustomDatePicker
                  label="To Date"
                  value={dateTo}
                  onChange={(d) => setDateTo(d)}
                  placeholder="To"
                  minDate={dateFrom}
                  maxDate={new Date()}
                />
              </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="source-filter-label">Source</InputLabel>
                <Select
                  labelId="source-filter-label"
                  value={sourceId}
                  label="Source"
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  <MenuItem value="">All Sources</MenuItem>
                  {flatSources.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Filters>

        {/* ── Revenue Chart ──────────────────────────────────────────────── */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Card variant="outlined">
            <CardHeader
              title={
                <Typography variant="subtitle1" fontWeight={600}>
                  Revenue by Source
                </Typography>
              }
            />
            <CardContent sx={{ height: 350 }}>
              {loading ? (
                <Box
                  sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
                >
                  <Skeleton variant="rectangular" width="100%" height="100%" />
                </Box>
              ) : reportData.length === 0 ? (
                <Box
                  sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
                >
                  <Typography color="text.secondary">No data for the selected period</Typography>
                </Box>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </CardContent>
          </Card>
        </Box>

        {/* ── Source Breakdown Table ──────────────────────────────────────── */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Card variant="outlined">
            <CardHeader
              title={
                <Typography variant="subtitle1" fontWeight={600}>
                  Source Breakdown
                </Typography>
              }
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Customers</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Avg. Revenue / Customer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton variant="text" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : sortedSourceTotals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No attribution data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSourceTotals.map(([name, totals]) => (
                      <TableRow key={name} hover>
                        <TableCell>
                          <Chip label={name} size="small" color="info" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{totals.customers}</TableCell>
                        <TableCell align="right">{totals.orders}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {fmt(totals.revenue)}
                        </TableCell>
                        <TableCell align="right">
                          {totals.customers > 0
                            ? fmt(totals.revenue / totals.customers)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>

        {/* ── Detailed Period Table ──────────────────────────────────────── */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Card variant="outlined">
            <CardHeader
              title={
                <Typography variant="subtitle1" fontWeight={600}>
                  Detailed Period Data
                </Typography>
              }
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Customers</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={`dskel-${i}`}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton variant="text" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : reportData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No data for the selected period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.source_name || "Unknown"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{row.customer_count || 0}</TableCell>
                        <TableCell align="right">{row.total_orders || 0}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {fmt(row.total_revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </Card>
    </Box>
  );
}
