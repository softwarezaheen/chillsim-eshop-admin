import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  LinearProgress,
  TextField,
  Checkbox,
  FormControlLabel,
  TablePagination,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserBundles } from "../../../core/apis/adminUsersAPI";

const statusColorMap = {
  active: "success",
  pending: "warning",
  expired: "default",
  depleted: "error",
};

const formatData = (mb) => {
  if (!mb || mb === 0) return "0 MB";
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${Number(mb).toFixed(0)} MB`;
};

export default function UserBundlesCard({ userId, onBundleClick }) {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [bundleSearch, setBundleSearch] = useState("");
  const [hideExpired, setHideExpired] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserBundles(userId, { 
        page: page + 1, 
        pageSize: pageSize,
        bundleSearch: bundleSearch || undefined,
        hideExpired: hideExpired || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setBundles(result.data || []);
        setTotalCount(result.count || 0);
        setStatistics(result.statistics || {});
      }
    } catch {
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  }, [userId, page, pageSize, bundleSearch, hideExpired]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6">Bundles</Typography>
            {!loading && (
              <>
                <Chip
                  label={`${statistics.active_bundles || 0} / ${statistics.total_bundles || 0} active`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.3 }}>
                      <Typography variant="caption" component="span">
                        {formatData(statistics.total_data_used_mb)} / {formatData(statistics.total_data_allocated_mb)}
                      </Typography>
                      {(statistics.unlimited_bundles || 0) > 0 && (
                        <Typography variant="caption" component="span" sx={{ fontSize: "0.65rem", opacity: 0.85 }}>
                          +{statistics.unlimited_bundles} unlimited
                        </Typography>
                      )}
                    </Box>
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: "auto", py: 0.75 }}
                />
              </>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={hideExpired}
                  onChange={(e) => {
                    setHideExpired(e.target.checked);
                    setPage(0);
                  }}
                />
              }
              label={<Typography variant="body2">Hide Expired</Typography>}
              sx={{ mr: 0 }}
            />
            <TextField
              size="small"
              placeholder="Search Bundle..."
              value={bundleSearch}
              onChange={(e) => {
                setBundleSearch(e.target.value);
                setPage(0);
              }}
              sx={{ width: 200 }}
            />
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 480, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Bundle</TableCell>
                <TableCell>Data Usage</TableCell>
                <TableCell>Countries</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : bundles.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No bundles found</Typography>
                      </TableCell>
                    </TableRow>
                  )
                : bundles.map((bundle) => {
                    const usagePercent = bundle.is_unlimited
                      ? null
                      : bundle.data_allocated_mb > 0
                      ? Math.min(100, ((bundle.data_used_mb || 0) / bundle.data_allocated_mb) * 100)
                      : 0;

                    // Format countries as flag icons with country names tooltip
                    const countries = bundle.countries || [];
                    const countryData = Array.isArray(countries)
                      ? countries.map((c) => {
                          if (typeof c === "string") return null;
                          return {
                            name: c?.country || "",
                            code: c?.country_code || c?.iso2 || "",
                            icon: c?.icon || "",
                          };
                        }).filter((c) => c && c.name)
                      : [];

                    return (
                      <TableRow
                        key={bundle.bundle_profile_id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => onBundleClick && onBundleClick(bundle)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                            {bundle.bundle_name || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: "block" }}>
                            {bundle.bundle_description || bundle.plan_type || ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {bundle.is_unlimited ? (
                            <Chip label="Unlimited" size="small" color="info" variant="outlined" />
                          ) : (
                            <Box sx={{ minWidth: 100 }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatData(bundle.data_used_mb || 0)} / {formatData(bundle.data_allocated_mb || 0)}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={usagePercent || 0}
                                sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                                color={usagePercent > 90 ? "error" : usagePercent > 70 ? "warning" : "primary"}
                              />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {countryData.length > 0 ? (
                            <Tooltip title={countryData.map((c) => c.name).join(", ")} arrow>
                              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 120 }}>
                                {countryData.slice(0, 5).map((c, idx) => (
                                  <img
                                    key={idx}
                                    src={c.icon}
                                    alt={c.name}
                                    style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2 }}
                                  />
                                ))}
                                {countryData.length > 5 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: "15px" }}>
                                    +{countryData.length - 5}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bundle.bundle_status}
                            color={statusColorMap[bundle.bundle_status] || "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {bundle.started_at ? dayjs(bundle.started_at).format("DD/MM/YY") : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {bundle.validity_end_date ? dayjs(bundle.validity_end_date).format("DD/MM/YY") : "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
}
