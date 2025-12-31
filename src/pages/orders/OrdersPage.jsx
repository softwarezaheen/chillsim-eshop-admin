//UTILITIES
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { toast } from "react-toastify";
//COMPONENT
import {
  Card,
  FormControl,
  TableCell,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  Collapse,
  Box,
  IconButton,
  Chip,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RestoreIcon from '@mui/icons-material/Restore';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import TagComponent from "../../Components/shared/tag-component/TagComponent";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { getAllOrders, refundOrder, getOrderStatistics } from "../../core/apis/ordersAPI";

function OrdersPage() {
  const [loading, setLoading] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [refundDialog, setRefundDialog] = useState({ open: false, order: null });
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResultDialog, setRefundResultDialog] = useState({ 
    open: false, 
    success: false, 
    data: null 
  });
  
  // Statistics for infographic cards
  const [statistics, setStatistics] = useState({
    successCount: 0,
    totalCount: 0,
    totalRevenueEUR: 0,
    topCountries: [],
    pendingCount: 0,
    refundedCount: 0,
    avgOrderValue: 0,
    payingCustomersCount: 0,
    avgOrdersPerCustomer: 0,
  });
  
  // Filter states
  const [inputFilters, setInputFilters] = useState({
    userEmail: '',
    orderStatus: 'success',
    orderType: '',
    paymentType: '',
    fromDate: null,
    toDate: null,
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    userEmail: '',
    orderStatus: 'success',
    orderType: '',
    paymentType: '',
    fromDate: null,
    toDate: null,
  });

  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const getOrders = async () => {
    setLoading(true);
    setStatsLoading(true);

    try {
      const { page, pageSize } = searchQueries;
      const { userEmail, orderStatus, orderType, paymentType, fromDate, toDate } = appliedFilters;
      
      // Format dates to YYYY-MM-DD without timezone
      const formatDateForAPI = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Fetch paginated orders (don't wait for stats)
      const result = await getAllOrders({
        page,
        pageSize,
        userEmail: userEmail || null,
        orderStatus: orderStatus || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
      });

      if (result?.error) {
        toast.error(result?.error);
        setData([]);
        setTotalRows(0);
        setStatistics({ successCount: 0, totalCount: 0, totalRevenueEUR: 0, topCountries: [], pendingCount: 0, refundedCount: 0, avgOrderValue: 0, payingCustomersCount: 0, avgOrdersPerCustomer: 0 });
        setStatsLoading(false);
      } else {
        setTotalRows(result?.count || 0);
        setData(result?.data || []);
        
        // Fetch statistics in background (non-blocking)
        getOrderStatistics({
          fromDate: formatDateForAPI(fromDate),
          toDate: formatDateForAPI(toDate),
        }).then(stats => {
          setStatistics(stats);
          setStatsLoading(false);
        }).catch(err => {
          console.error("Failed to load statistics:", err);
          setStatsLoading(false);
        });
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
      toast.error("Failed to load orders");
      setData([]);
      setTotalRows(0);
      setStatistics({ successCount: 0, totalCount: 0, totalRevenueEUR: 0, topCountries: [], pendingCount: 0, refundedCount: 0, avgOrderValue: 0, payingCustomersCount: 0, avgOrdersPerCustomer: 0 });
      setStatsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQueries.page, searchQueries.pageSize, appliedFilters]);

  const resetFilters = () => {
    setInputFilters({
      userEmail: '',
      orderStatus: 'success',
      orderType: '',
      paymentType: '',
      fromDate: null,
      toDate: null,
    });
    setAppliedFilters({
      userEmail: '',
      orderStatus: 'success',
      orderType: '',
      paymentType: '',
      fromDate: null,
      toDate: null,
    });
    setSearchQueries({ pageSize: 10, page: 0 });
  };

  const applyFilter = () => {
    setAppliedFilters({ ...inputFilters });
    setSearchQueries({ ...searchQueries, page: 0 });
  };

  const handleRefund = (order) => {
    setRefundDialog({ open: true, order });
  };

  const confirmRefund = async () => {
    const order = refundDialog.order;
    
    if (!order.payment_intent_code) {
      toast.error('No payment intent found for this order');
      setRefundDialog({ open: false, order: null });
      return;
    }

    setRefundLoading(true);

    try {
      const result = await refundOrder({
        orderId: order.id,
        paymentIntentId: order.payment_intent_code,
        amount: null, // Full refund
      });

      setRefundDialog({ open: false, order: null });

      if (result.success) {
        // Show success modal with refund details
        // result.refundData contains the Stripe refund response
        // result.refundData.data contains the actual refund details
        const refundData = result.refundData?.data || result.refundData;
        console.log('Refund result.refundData:', result.refundData);
        console.log('Extracted refundData:', refundData);
        
        setRefundResultDialog({
          open: true,
          success: true,
          data: refundData,
        });
        // Refresh the orders list
        getOrders();
      } else {
        // Show error modal
        setRefundResultDialog({
          open: true,
          success: false,
          data: {
            code: result.error?.code || 400,
            name: result.error?.name || 'Refund Failed',
            details: result.error?.details || result.error || 'Failed to process refund',
          },
        });
      }
    } catch (error) {
      console.error('Refund error:', error);
      setRefundDialog({ open: false, order: null });
      setRefundResultDialog({
        open: true,
        success: false,
        data: {
          code: 500,
          name: 'Server Error',
          details: error.message || 'An unexpected error occurred',
        },
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const cancelRefund = () => {
    setRefundDialog({ open: false, order: null });
  };

  const calculateTotalAmount = (order) => {
    const modifiedAmount = order.modified_amount || 0;
    const fee = order.fee || 0;
    const vat = order.vat || 0;
    // For exclusive mode, add VAT on top; for inclusive/none, VAT is already in amount
    if (order.tax_mode === 'exclusive') {
      return (modifiedAmount + fee + vat) / 100; // Convert from cents
    }
    // inclusive or none mode - VAT already included
    return (modifiedAmount + fee) / 100;
  };

  const getBundleInfo = (bundleData) => {
    try {
      if (!bundleData || bundleData === "-") return { name: "N/A", subtitle: "" };
      const parsed = JSON.parse(bundleData);
      return {
        name: parsed.display_title || "N/A",
        subtitle: parsed.subtitle || parsed.description || "",
      };
    } catch {
      return { name: "N/A", subtitle: "" };
    }
  };

  const tableHeaders = [
    { name: "" }, // Expand icon
    { name: "Date" },
    { name: "User Email" },
    { name: "Billing Country" },
    { name: "Status" },
    { name: "Product" },
    { name: "Type" },
    { name: "Tax Mode" },
    { name: "Total Amount" },
    { name: "EUR Amount" },
    { name: "Actions" },
  ];

  return (
    <Card className="page-card">
      {/* Statistics Cards */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          {/* Success Orders & Breakdown Card */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}>
              {statsLoading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(102, 126, 234, 0.9)',
                  borderRadius: 2,
                  zIndex: 1,
                }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              )}
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Orders Overview
              </Typography>
              <Box sx={{ flex: 1 }}>
                {/* Success Orders */}
                <Box sx={{ 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        <CountUp
                          start={0}
                          end={statistics.successCount}
                          duration={2}
                          separator=","
                        />
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Success Orders
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}>
                      ✓
                    </Box>
                  </Box>
                </Box>

                {/* Breakdown */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Pending
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        start={0}
                        end={statistics.pendingCount}
                        duration={2}
                        separator=","
                      />
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Refunded
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        start={0}
                        end={statistics.refundedCount}
                        duration={2}
                        separator=","
                      />
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 1,
                    mt: 0.5,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'bold' }}>
                      Success Rate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        start={0}
                        end={statistics.totalCount > 0 ? (statistics.successCount / statistics.totalCount * 100) : 0}
                        duration={2}
                        decimals={1}
                        suffix="%"
                      />
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Top Countries Card */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
              minHeight: '280px',
              position: 'relative',
            }}>
              {statsLoading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(240, 147, 251, 0.9)',
                  borderRadius: 2,
                  zIndex: 1,
                }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              )}
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Top 3 Countries
              </Typography>
              {statistics.topCountries && statistics.topCountries.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {statistics.topCountries.map((country, index) => (
                    <Box 
                      key={country.country}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1.5,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                        }}>
                          {index + 1}
                        </Box>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                            {country.country}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {country.count} orders
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        €{country.revenue.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '200px',
                  opacity: 0.6
                }}>
                  <Typography variant="body2">
                    No country data available
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Total Revenue & Metrics Card */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}>
              {statsLoading && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(79, 172, 254, 0.9)',
                  borderRadius: 2,
                  zIndex: 1,
                }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              )}
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Revenue Metrics
              </Typography>
              <Box sx={{ flex: 1 }}>
                {/* Total Revenue */}
                <Box sx={{ 
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                        €<CountUp
                          start={0}
                          end={statistics.totalRevenueEUR}
                          duration={2}
                          separator=","
                          decimals={2}
                        />
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Total Revenue
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}>
                      💰
                    </Box>
                  </Box>
                </Box>

                {/* Metrics */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Avg Order Value
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      €<CountUp
                        start={0}
                        end={statistics.avgOrderValue}
                        duration={2}
                        separator=","
                        decimals={2}
                      />
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 1,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Paying Customers
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        start={0}
                        end={statistics.payingCustomersCount}
                        duration={2}
                        separator=","
                      />
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 1,
                    mt: 0.5,
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 'bold' }}>
                      Avg Orders/Customer
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <CountUp
                        start={0}
                        end={statistics.avgOrdersPerCustomer}
                        duration={2}
                        decimals={1}
                      />
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={false}
      >
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <TextField
                label="User Email"
                placeholder="Search by email..."
                value={inputFilters.userEmail}
                onChange={(e) => setInputFilters({ ...inputFilters, userEmail: e.target.value })}
                size="small"
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Order Status</InputLabel>
              <Select
                value={inputFilters.orderStatus}
                label="Order Status"
                onChange={(e) => setInputFilters({ ...inputFilters, orderStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Order Type</InputLabel>
              <Select
                value={inputFilters.orderType}
                label="Order Type"
                onChange={(e) => setInputFilters({ ...inputFilters, orderType: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="assign">Assign</MenuItem>
                <MenuItem value="topup">Topup</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={inputFilters.paymentType}
                label="Payment Type"
                onChange={(e) => setInputFilters({ ...inputFilters, paymentType: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Wallet">Wallet</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomDatePicker
              value={inputFilters.fromDate}
              onChange={(date) => setInputFilters({ ...inputFilters, fromDate: date })}
              placeholder="From Date"
              label="From Date"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomDatePicker
              value={inputFilters.toDate}
              onChange={(date) => setInputFilters({ ...inputFilters, toDate: date })}
              placeholder="To Date"
              label="To Date"
            />
          </Grid>
        </Grid>
      </Filters>

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        noDataFound={"No Orders Found"}
        tableHeaders={tableHeaders}
        actions={false}
      >
        {data?.map((order) => {
          const bundleInfo = getBundleInfo(order.bundle_data);
          const isExpanded = expandedRow === order.id;
          
          return (
            <>
              <RowComponent key={order.id} actions={false}>
                <TableCell sx={{ width: '40px', padding: '8px' }}>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                  >
                    {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>

                <TableCell sx={{ minWidth: "130px" }}>
                  {order.created_at
                    ? dayjs(order.created_at).format("DD-MM-YYYY HH:mm")
                    : "N/A"}
                </TableCell>

                <TableCell sx={{ minWidth: "150px", maxWidth: "180px" }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.user_email || "N/A"}
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "100px" }}>
                  {order.billing_country || "N/A"}
                </TableCell>

                <TableCell sx={{ minWidth: "100px" }}>
                  <TagComponent value={order.payment_status} />
                </TableCell>

                <TableCell sx={{ minWidth: "180px", maxWidth: "200px" }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div className="font-semibold" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bundleInfo.name}
                    </div>
                    {bundleInfo.subtitle && (
                      <div className="text-xs text-gray-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bundleInfo.subtitle}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "90px" }}>
                  <Chip 
                    label={order.order_type || "N/A"} 
                    size="small"
                    color={order.order_type === 'topup' ? 'secondary' : 'default'}
                  />
                </TableCell>

                <TableCell sx={{ minWidth: "90px" }}>
                  <Chip 
                    label={order.tax_mode || "exclusive"} 
                    size="small"
                    color={
                      order.tax_mode === 'inclusive' ? 'success' : 
                      order.tax_mode === 'none' ? 'warning' : 
                      'default'
                    }
                    variant="outlined"
                  />
                </TableCell>

                <TableCell sx={{ minWidth: "120px" }}>
                  <div className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                    <span>
                      {order.currency}{" "}
                      <CountUp
                        start={0}
                        end={calculateTotalAmount(order)}
                        duration={1.5}
                        separator=","
                        decimals={2}
                      />
                    </span>
                    {order.payment_type === 'Wallet' ? (
                      <WalletIcon sx={{ fontSize: 16, color: '#9c27b0' }} />
                    ) : order.payment_type === 'Card' ? (
                      <CreditCardIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                    ) : null}
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "110px" }}>
                  <div className="font-semibold" style={{ fontSize: '0.875rem' }}>
                    {order.eur_amount !== null ? (
                      <>
                        EUR{" "}
                        <CountUp
                          start={0}
                          end={order.eur_amount}
                          duration={1.5}
                          separator=","
                          decimals={2}
                        />
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "80px" }}>
                  {order.payment_status === 'success' && order.payment_type !== 'Wallet' && (
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleRefund(order)}
                      title="Refund Order"
                    >
                      <RestoreIcon />
                    </IconButton>
                  )}
                </TableCell>
              </RowComponent>

              {/* Expandable Details Row */}
              <RowComponent key={`${order.id}-details`} actions={false}>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 2, padding: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom component="div" sx={{ mb: 3 }}>
                        Order Details
                      </Typography>

                      <Grid container spacing={3}>
                        {/* Order Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📋 Order Information
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <DetailRow label="Order ID" value={order.id} />
                            <DetailRow label="Order Type" value={order.order_type} />
                            <DetailRow label="Order Status" value={order.order_status} />
                            <DetailRow label="Payment Status" value={order.payment_status} />
                            <DetailRow label="Created At" value={dayjs(order.created_at).format("DD-MM-YYYY HH:mm:ss")} />
                            {order.payment_time && (
                              <DetailRow label="Payment Time" value={dayjs(order.payment_time).format("DD-MM-YYYY HH:mm:ss")} />
                            )}
                            {order.callback_time && (
                              <DetailRow label="Callback Time" value={dayjs(order.callback_time).format("DD-MM-YYYY HH:mm:ss")} />
                            )}
                          </Box>
                        </Grid>

                        {/* Payment Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                            💳 Payment Information
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <DetailRow label="Payment Intent" value={order.payment_intent_code || "N/A"} />
                            <DetailRow label="Payment Type" value={order.payment_type || "N/A"} />
                            <DetailRow label="Currency" value={order.currency} />
                            <DetailRow label="Display Currency" value={order.display_currency || order.currency} />
                            <DetailRow label="Exchange Rate" value={order.exchange_rate || "1.0"} />
                            <Divider sx={{ my: 1 }} />
                            <DetailRow label="Original Amount" value={`${((order.original_amount || order.amount) / 100).toFixed(2)} ${order.currency}`} />
                            <DetailRow label="Modified Amount" value={`${((order.modified_amount || 0) / 100).toFixed(2)} ${order.currency}`} />
                            <DetailRow label="Fee" value={`${((order.fee || 0) / 100).toFixed(2)} ${order.currency}`} />
                            <DetailRow label="VAT" value={`${((order.vat || 0) / 100).toFixed(2)} ${order.currency}`} />
                            <DetailRow 
                              label="Total Amount" 
                              value={`${calculateTotalAmount(order).toFixed(2)} ${order.currency}`}
                              bold
                            />
                            {order.payment_amount && (
                              <DetailRow 
                                label="Payment Amount" 
                                value={`${order.payment_amount.toFixed(2)} ${order.display_currency || order.currency}`} 
                              />
                            )}
                          </Box>
                        </Grid>

                        {/* User Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                            👤 User Information
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <DetailRow label="User ID" value={order.user_id || "Deleted User"} />
                            <DetailRow label="Email" value={order.user_email || "N/A"} />
                            <DetailRow label="Phone" value={order.user?.metadata?.msisdn || "N/A"} />
                            {order.anonymous_user_id && order.anonymous_user_id !== order.user_id && (
                              <DetailRow label="Anonymous User ID" value={order.anonymous_user_id} />
                            )}
                          </Box>
                        </Grid>

                        {/* Bundle & Promotion Information */}
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                            📦 Bundle & Promotions
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <DetailRow label="Bundle ID" value={order.bundle_id} />
                            <DetailRow label="Bundle Name" value={bundleInfo.name} />
                            {bundleInfo.subtitle && (
                              <DetailRow label="Bundle Subtitle" value={bundleInfo.subtitle} />
                            )}
                            {order.searched_countries && (
                              <DetailRow label="Searched Countries" value={order.searched_countries} />
                            )}
                            <DetailRow label="Promo Code" value={order.promo_code || "N/A"} />
                            <DetailRow label="Referral Code" value={order.referral_code || "N/A"} />
                            {order.esim_order_id && (
                              <DetailRow label="eSIM Order ID" value={order.esim_order_id} />
                            )}
                            {order.otp && (
                              <DetailRow label="OTP" value={order.otp} />
                            )}
                          </Box>
                        </Grid>

                        {/* Documents Information */}
                        {(order.invoice_id || order.credit_note_id || order.pdf_url) && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                              📄 Documents
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                              {order.invoice_id && (
                                <DetailRow label="Invoice ID" value={order.invoice_id} />
                              )}
                              {order.credit_note_id && (
                                <DetailRow label="Credit Note ID" value={order.credit_note_id} />
                              )}
                              {order.pdf_url && (
                                <DetailRow 
                                  label="PDF URL" 
                                  value={
                                    <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      View Document
                                    </a>
                                  } 
                                />
                              )}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Collapse>
                </TableCell>
              </RowComponent>
            </>
          );
        })}
      </TableComponent>

      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries?.page}
        onPageChange={(e, newPage) => {
          setSearchQueries({ ...searchQueries, page: newPage });
        }}
        rowsPerPage={searchQueries?.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({ ...searchQueries, pageSize: parseInt(e.target.value), page: 0 });
        }}
      />

      {/* Refund Confirmation Dialog */}
      <Dialog
        open={refundDialog.open}
        onClose={cancelRefund}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          Confirm Refund
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to refund this order?
          </Typography>
          {refundDialog.order && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Order ID:</strong> {refundDialog.order.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>User Email:</strong> {refundDialog.order.user_email || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Amount:</strong> {refundDialog.order.currency} {calculateTotalAmount(refundDialog.order).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Payment Intent:</strong> {refundDialog.order.payment_intent_code || 'N/A'}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone. The full amount will be refunded to the customer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRefund} disabled={refundLoading}>
            Cancel
          </Button>
          <Button
            onClick={confirmRefund}
            variant="contained"
            color="warning"
            disabled={refundLoading}
            startIcon={refundLoading ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {refundLoading ? 'Processing...' : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Result Dialog */}
      <Dialog
        open={refundResultDialog.open}
        onClose={() => setRefundResultDialog({ open: false, success: false, data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle 
          sx={{ 
            bgcolor: refundResultDialog.success ? 'success.light' : 'error.light',
            color: refundResultDialog.success ? 'success.contrastText' : 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {refundResultDialog.success ? (
            <>
              ✓ Refund Successful
            </>
          ) : (
            <>
              ✕ Refund Failed
            </>
          )}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {refundResultDialog.success ? (
            // Success Content
            <Box>
              <Typography variant="body1" gutterBottom sx={{ mb: 3, color: 'success.dark', fontWeight: 'medium' }}>
                {refundResultDialog.data?.message || 'Refund initiated successfully. Credit note will be generated automatically.'}
              </Typography>
              
              <Box sx={{ bgcolor: 'grey.50', p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Refund ID
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>
                      {refundResultDialog.data?.refund_id || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Status
                    </Typography>
                    <Chip 
                      label={refundResultDialog.data?.status || 'Succeeded'} 
                      color="success" 
                      size="small" 
                      sx={{ mt: 0.5, textTransform: 'capitalize' }}
                    />
                  </Grid>

                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Amount
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {refundResultDialog.data?.currency?.toUpperCase() || 'EUR'} {(refundResultDialog.data?.amount || 0).toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Payment Intent
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {refundResultDialog.data?.payment_intent_id || 'N/A'}
                    </Typography>
                  </Grid>

                  {refundResultDialog.data?.reason && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Reason
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {refundResultDialog.data.reason}
                      </Typography>
                    </Grid>
                  )}

                  {refundResultDialog.data?.created_at && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Processed At
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {dayjs(refundResultDialog.data.created_at).format('DD-MM-YYYY HH:mm:ss')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          ) : (
            // Error Content
            <Box>
              <Box sx={{ 
                bgcolor: 'error.lighter', 
                p: 2.5, 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'error.light',
                mb: 2,
              }}>
                <Typography variant="h6" color="error.dark" gutterBottom>
                  {refundResultDialog.data?.name || 'Error'}
                </Typography>
                <Typography variant="body2" color="error.dark">
                  {refundResultDialog.data?.details || 'An error occurred while processing the refund.'}
                </Typography>
                {refundResultDialog.data?.code && (
                  <Typography variant="caption" color="error.main" display="block" sx={{ mt: 1 }}>
                    Error Code: {refundResultDialog.data.code}
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                Please check the payment status and try again. If the problem persists, contact support.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setRefundResultDialog({ open: false, success: false, data: null })}
            variant="contained"
            color={refundResultDialog.success ? 'success' : 'primary'}
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// Helper component for detail rows
const DetailRow = ({ label, value, bold = false }) => (
  <Box sx={{ display: 'flex', py: 0.5 }}>
    <Typography variant="body2" sx={{ minWidth: '180px', color: 'text.secondary' }}>
      {label}:
    </Typography>
    <Typography 
      variant="body2" 
      sx={{ 
        fontWeight: bold ? 'bold' : 'normal',
        wordBreak: 'break-all'
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default OrdersPage;
