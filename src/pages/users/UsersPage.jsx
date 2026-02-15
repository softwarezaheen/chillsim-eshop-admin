import { ContentCopy } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import {
  Card,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  Skeleton,
  Box,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { getUsers } from "../../core/apis/adminUsersAPI";

function UsersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // Search & filter state
  const [search, setSearch] = useState("");
  const [createdFrom, setCreatedFrom] = useState(null);
  const [createdTo, setCreatedTo] = useState(null);
  const [hasOrders, setHasOrders] = useState(""); // "" = all, "true" = with orders, "false" = without orders
  const [accountSource, setAccountSource] = useState(""); // "" = all, "email", "google", "apple", "facebook"
  const [marketingSubscribed, setMarketingSubscribed] = useState(""); // "" = all, "true" = subscribed, "false" = not subscribed

  // Pagination state (MUI is 0-indexed, API is 1-indexed)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Sort state
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  // Applied filters (only sent to API on Apply click)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    createdFrom: null,
    createdTo: null,
    hasOrders: "",
    accountSource: "",
    marketingSubscribed: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers({
        page: page + 1, // Convert 0-indexed to 1-indexed
        pageSize,
        search: appliedFilters.search || undefined,
        created_from: appliedFilters.createdFrom
          ? appliedFilters.createdFrom.toISOString()
          : undefined,
        created_to: appliedFilters.createdTo
          ? appliedFilters.createdTo.toISOString()
          : undefined,
        has_orders: appliedFilters.hasOrders === "" ? undefined : appliedFilters.hasOrders === "true",
        account_source: appliedFilters.accountSource || undefined,
        marketing_subscribed: appliedFilters.marketingSubscribed === "" ? undefined : appliedFilters.marketingSubscribed === "true",
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      if (result.error) {
        toast.error(result.error);
        setData([]);
        setTotalRows(0);
      } else {
        setData(result.data || []);
        setTotalRows(result.count || 0);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to load users");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortDir, appliedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const applyFilter = () => {
    setPage(0);
    setAppliedFilters({
      search,
      createdFrom,
      createdTo,
      hasOrders,
      accountSource,
      marketingSubscribed,
    });
  };

  const resetFilters = () => {
    setSearch("");
    setCreatedFrom(null);
    setCreatedTo(null);
    setHasOrders("");
    setAccountSource("");
    setMarketingSubscribed("");
    setPage(0);
    setAppliedFilters({
      search: "",
      createdFrom: null,
      createdTo: null,
      hasOrders: "",
      accountSource: "",
      marketingSubscribed: "",
    });
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setPage(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", { autoClose: 1500 });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "€0.00";
    return `€${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const sortableColumns = [
    { id: "email_user", label: "Email / User ID", sortable: false },
    { id: "name", label: "Name", sortable: false },
    { id: "country", label: "Country", sortKey: "country" },
    { id: "marketing_consent", label: "Marketing", sortKey: "marketing_consent" },
    { id: "wallet_balance", label: "Wallet Balance", sortKey: "wallet_balance" },
    { id: "orders", label: "Orders", sortKey: "orders" },
    { id: "revenue", label: "Revenue", sortKey: "revenue" },
    { id: "created", label: "Created", sortKey: "created_at" },
  ];

  const renderSkeletonRows = () =>
    Array.from({ length: pageSize }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        {sortableColumns.map((col) => (
          <TableCell key={col.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <Card className="page-card">
      {/* Filters */}
      <Filters onReset={resetFilters} onApply={applyFilter} applyDisable={false}>
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Search (Email, User ID, or Name)
              </label>
              <TextField
                id="search-input"
                fullWidth
                size="small"
                placeholder="Search by email, user ID, or name"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    autoComplete: "new-password",
                    form: { autoComplete: "off" },
                  },
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilter();
                }}
              />
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <CustomDatePicker
                label="Account Created From"
                value={createdFrom}
                onChange={(date) => setCreatedFrom(date)}
                placeholder="From date"
                maxDate={createdTo || new Date()}
              />
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth>
              <CustomDatePicker
                label="Account Created To"
                value={createdTo}
                onChange={(date) => setCreatedTo(date)}
                placeholder="To date"
                minDate={createdFrom}
                maxDate={new Date()}
              />
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="has-orders-label">Order Status</InputLabel>
              <Select
                labelId="has-orders-label"
                id="has-orders-select"
                value={hasOrders}
                label="Order Status"
                onChange={(e) => setHasOrders(e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="true">With Orders</MenuItem>
                <MenuItem value="false">Without Orders</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="account-source-label">Account Source</InputLabel>
              <Select
                labelId="account-source-label"
                id="account-source-select"
                value={accountSource}
                label="Account Source"
                onChange={(e) => setAccountSource(e.target.value)}
              >
                <MenuItem value="">All Sources</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="apple">Apple</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="marketing-subscribed-label">Marketing Status</InputLabel>
              <Select
                labelId="marketing-subscribed-label"
                id="marketing-subscribed-select"
                value={marketingSubscribed}
                label="Marketing Status"
                onChange={(e) => setMarketingSubscribed(e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="true">Subscribed</MenuItem>
                <MenuItem value="false">Not Subscribed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Filters>

      {/* Users Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {sortableColumns.map((col) => (
                <TableCell key={col.id}>
                  {col.sortKey ? (
                    <TableSortLabel
                      active={sortBy === col.sortKey}
                      direction={sortBy === col.sortKey ? sortDir : "asc"}
                      onClick={() => handleSort(col.sortKey)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={sortableColumns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((user) => (
                <TableRow
                  key={user.user_id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/users/${user.user_id}`)}
                >
                  {/* Email / User ID */}
                  <TableCell sx={{ minWidth: 250 }}>
                    <Box>
                      <Link
                        to={`/users/${user.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textDecoration: "none", fontWeight: 500 }}
                      >
                        {user.email || "N/A"}
                      </Link>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.user_id}
                        </Typography>
                        <Tooltip title="Copy User ID">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(user.user_id);
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Name */}
                  <TableCell sx={{ minWidth: 150 }}>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                      : "N/A"}
                  </TableCell>

                  {/* Country */}
                  <TableCell sx={{ minWidth: 120 }}>
                    {user.country || "—"}
                  </TableCell>

                  {/* Marketing Consent */}
                  <TableCell sx={{ minWidth: 100 }}>
                    <Chip
                      label={user.marketing_consent ? "Subscribed" : "Not Subscribed"}
                      size="small"
                      color={user.marketing_consent ? "success" : "default"}
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Wallet Balance */}
                  <TableCell sx={{ minWidth: 120 }}>
                    <Chip
                      label={`${formatCurrency(user.wallet_balance)}`}
                      size="small"
                      variant="outlined"
                      color={user.wallet_balance > 0 ? "success" : "default"}
                    />
                  </TableCell>

                  {/* Orders (successful / total) */}
                  <TableCell sx={{ minWidth: 100 }}>
                    <Typography variant="body2">
                      <Box component="span" sx={{ fontWeight: 600, color: "success.main" }}>
                        {user.successful_orders || 0}
                      </Box>
                      {" / "}
                      {user.total_orders || 0}
                    </Typography>
                  </TableCell>

                  {/* Revenue */}
                  <TableCell sx={{ minWidth: 100 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(user.total_revenue_eur)}
                    </Typography>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell sx={{ minWidth: 110 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(user.account_created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Card>
  );
}

export default UsersPage;
