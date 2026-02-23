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
  TablePagination,
  TextField,
  Checkbox,
  FormControlLabel,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import {
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserOrders } from "../../../core/apis/adminUsersAPI";

const statusColorMap = {
  success: "success",
  pending: "warning",
  failure: "error",
  canceled: "default",
  refunded: "info",
};

// Format currency with proper symbol/code
const formatCurrency = (amount, currency = "EUR") => {
  if (amount === null || amount === undefined) return `${getCurrencySymbol(currency)}0.00`;
  return `${getCurrencySymbol(currency)}${Number(amount).toFixed(2)}`;
};

const getCurrencySymbol = (currency) => {
  const symbols = {
    EUR: "€",
    RON: "RON ",
    INR: "₹",
  };
  return symbols[currency] || `${currency} `;
};

// Calculate the actual charged amount
const getChargedAmount = (order) => {
  // Use modified_amount if present and > 0, otherwise use original_amount
  return (order.modified_amount > 0 ? order.modified_amount : order.original_amount) || 0;
};

// Get the display currency for an order (use display_currency if available, otherwise currency)
const getOrderCurrency = (order) => {
  return order.display_currency || order.currency || "EUR";
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = dayjs(dateString);
  return date.format("DD MMM YY");
};

const formatFullDate = (dateString) => {
  if (!dateString) return "";
  const date = dayjs(dateString);
  return date.format("DD MMMM YYYY HH:mm:ss");
};

export default function UserOrdersCard({ userId, onOrderClick }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter states
  const [orderIdSearch, setOrderIdSearch] = useState("");
  const [hideIncomplete, setHideIncomplete] = useState(false);
  
  // Sort states
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserOrders(userId, {
        page: page + 1,
        pageSize,
        orderId: orderIdSearch || undefined,
        hideIncomplete,
        sortBy,
        sortDir,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setData(result.data || []);
        setTotalCount(result.count || 0);
        setStatistics(result.statistics || {});
      }
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [userId, page, pageSize, orderIdSearch, hideIncomplete, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6">Orders</Typography>
            {!loading && (
              <>
                <Chip
                  label={`€${Number(statistics.total_revenue_eur || 0).toFixed(2)} revenue (EUR)`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`${statistics.successful_orders || 0} / ${statistics.total_orders || 0} successful`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideIncomplete}
                  onChange={(e) => {
                    setHideIncomplete(e.target.checked);
                    setPage(0);
                  }}
                  size="small"
                />
              }
              label={<Typography variant="caption">Hide Incomplete</Typography>}
              sx={{ m: 0, whiteSpace: "nowrap" }}
            />
            <TextField
              placeholder="Search Order ID..."
              size="small"
              value={orderIdSearch}
              onChange={(e) => {
                setOrderIdSearch(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 180 }}
            />
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Original Amount</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "payment_amount"}
                    direction={sortBy === "payment_amount" ? sortDir : "asc"}
                    onClick={() => handleSort("payment_amount")}
                  >
                    Total Charged
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "created_at"}
                    direction={sortBy === "created_at" ? sortDir : "asc"}
                    onClick={() => handleSort("created_at")}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No orders found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                : data.map((order) => (
                    <TableRow
                      key={order.order_id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => onOrderClick && onOrderClick(order)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {order.order_id?.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.order_type === "Assign" ? "Initial" : "Top-up"}
                          color={order.order_type === "Assign" ? "info" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_status}
                          color={statusColorMap[order.payment_status] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(order.original_amount, getOrderCurrency(order))}</TableCell>
                      <TableCell>
                        {order.discount_amount > 0 ? (
                          <Typography variant="body2" color="error.main">
                            -{formatCurrency(order.discount_amount, getOrderCurrency(order))}
                          </Typography>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {order.payment_type === "Wallet" ? (
                            <WalletIcon sx={{ fontSize: 16, color: "warning.main" }} />
                          ) : (
                            <CardIcon sx={{ fontSize: 16, color: "primary.main" }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(getChargedAmount(order), getOrderCurrency(order))}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatFullDate(order.created_at)} arrow>
                          <Typography variant="body2" color="text.secondary" sx={{ cursor: "help" }}>
                            {formatDate(order.created_at)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  );
}
