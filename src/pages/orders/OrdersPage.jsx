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
import RefundIcon from '@mui/icons-material/AccountBalanceWallet';
import Filters from "../../Components/Filters/Filters";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import TagComponent from "../../Components/shared/tag-component/TagComponent";
import { getAllOrders, refundOrder } from "../../core/apis/ordersAPI";

function OrdersPage() {
  const [loading, setLoading] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [refundDialog, setRefundDialog] = useState({ open: false, order: null });
  const [refundLoading, setRefundLoading] = useState(false);
  
  // Filter states
  const [inputFilters, setInputFilters] = useState({
    userEmail: '',
    orderStatus: '',
    orderType: '',
    paymentType: '',
  });
  
  const [appliedFilters, setAppliedFilters] = useState({
    userEmail: '',
    orderStatus: '',
    orderType: '',
    paymentType: '',
  });

  const [searchQueries, setSearchQueries] = useState({
    pageSize: 10,
    page: 0,
  });

  const getOrders = async () => {
    setLoading(true);

    try {
      const { page, pageSize } = searchQueries;
      const { userEmail, orderStatus, orderType, paymentType } = appliedFilters;
      
      const result = await getAllOrders({
        page,
        pageSize,
        userEmail: userEmail || null,
        orderStatus: orderStatus || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
      });

      if (result?.error) {
        toast.error(result?.error);
        setData([]);
        setTotalRows(0);
      } else {
        setTotalRows(result?.count || 0);
        setData(result?.data || []);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
      toast.error("Failed to load orders");
      setData([]);
      setTotalRows(0);
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
      orderStatus: '',
      orderType: '',
      paymentType: '',
    });
    setAppliedFilters({
      userEmail: '',
      orderStatus: '',
      orderType: '',
      paymentType: '',
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

      if (result.success) {
        toast.success('Order refunded successfully!');
        setRefundDialog({ open: false, order: null });
        // Refresh the orders list
        getOrders();
      } else {
        toast.error(result.error || 'Failed to refund order');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to refund order');
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
    return (modifiedAmount + fee + vat) / 100; // Convert from cents
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
    { name: "Status" },
    { name: "Product" },
    { name: "Type" },
    { name: "Total Amount" },
    { name: "Actions" },
  ];

  return (
    <Card className="page-card">
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
                <TableCell sx={{ width: '50px' }}>
                  <IconButton
                    size="small"
                    onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                  >
                    {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>

                <TableCell sx={{ minWidth: "150px" }}>
                  {order.created_at
                    ? dayjs(order.created_at).format("DD-MM-YYYY HH:mm")
                    : "N/A"}
                </TableCell>

                <TableCell sx={{ minWidth: "200px" }}>
                  {order.user_email || "N/A"}
                </TableCell>

                <TableCell sx={{ minWidth: "120px" }}>
                  <TagComponent value={order.payment_status} />
                </TableCell>

                <TableCell sx={{ minWidth: "250px" }}>
                  <div>
                    <div className="font-semibold">{bundleInfo.name}</div>
                    {bundleInfo.subtitle && (
                      <div className="text-xs text-gray-500 mt-1">{bundleInfo.subtitle}</div>
                    )}
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "100px" }}>
                  <Chip 
                    label={order.order_type || "N/A"} 
                    size="small"
                    color={order.order_type === 'topup' ? 'secondary' : 'default'}
                  />
                </TableCell>

                <TableCell sx={{ minWidth: "150px" }}>
                  <div className="font-semibold">
                    {order.currency}{" "}
                    <CountUp
                      start={0}
                      end={calculateTotalAmount(order)}
                      duration={1.5}
                      separator=","
                      decimals={2}
                    />
                  </div>
                </TableCell>

                <TableCell sx={{ minWidth: "100px" }}>
                  {order.payment_status === 'success' && (
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleRefund(order)}
                      title="Refund Order"
                    >
                      <RefundIcon />
                    </IconButton>
                  )}
                </TableCell>
              </RowComponent>

              {/* Expandable Details Row */}
              <RowComponent key={`${order.id}-details`} actions={false}>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
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
                            <DetailRow label="User ID" value={order.user_id} />
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
            startIcon={refundLoading ? <CircularProgress size={20} /> : <RefundIcon />}
          >
            {refundLoading ? 'Processing...' : 'Confirm Refund'}
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
