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
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserFinancialDocs } from "../../../core/apis/adminUsersAPI";
import { downloadInvoice, downloadCreditNote } from "../../../core/apis/financialAPI";

const docTypeColorMap = {
  invoice: "primary",
  credit_note: "warning",
};

const docTypeLabels = {
  invoice: "Invoice",
  credit_note: "Credit Note",
};

export default function UserFinancialDocsCard({ userId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloading, setDownloading] = useState(null);
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [docSearch, setDocSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserFinancialDocs(userId, {
        page: page + 1,
        pageSize: rowsPerPage,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        let filteredDocs = result.data || [];
        
        // Apply document type filter
        if (docTypeFilter !== "all") {
          filteredDocs = filteredDocs.filter((doc) => doc.document_type === docTypeFilter);
        }
        
        // Apply document number search
        if (docSearch) {
          filteredDocs = filteredDocs.filter((doc) => 
            doc.document_number?.toLowerCase().includes(docSearch.toLowerCase()) ||
            doc.sequence_number?.toString().includes(docSearch)
          );
        }
        
        setDocs(filteredDocs);
        setTotalCount(filteredDocs.length);
      }
    } catch {
      toast.error("Failed to load financial documents");
    } finally {
      setLoading(false);
    }
  }, [userId, page, rowsPerPage, docTypeFilter, docSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopyPaymentIntent = (paymentIntentId) => {
    if (paymentIntentId) {
      navigator.clipboard.writeText(paymentIntentId);
      toast.success("Payment intent copied to clipboard");
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(doc.document_id);
    try {
      const result = doc.document_type === "invoice"
        ? await downloadInvoice(doc.document_id)
        : await downloadCreditNote(doc.document_id);

      if (result.error) {
        toast.error(`Download failed: ${result.error}`);
        return;
      }

      // Create blob download
      const blob = new Blob([result.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.document_number || doc.document_type}_${doc.document_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6">Financial Documents</Typography>
            {!loading && (
              <Chip label={`${totalCount} total`} size="small" variant="outlined" />
            )}
          </Box>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={docTypeFilter}
                onChange={(e) => {
                  setDocTypeFilter(e.target.value);
                  setPage(0);
                }}
                label="Document Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="credit_note">Credit Note</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Search Document #"
              value={docSearch}
              onChange={(e) => {
                setDocSearch(e.target.value);
                setPage(0);
              }}
              sx={{ width: 180 }}
            />
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Document #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>VAT Type</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>VAT Amount</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Payment Intent</TableCell>
                <TableCell align="center">PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : docs.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No financial documents found</Typography>
                      </TableCell>
                    </TableRow>
                  )
                : docs.map((doc) => {
                    const vatPercentage = doc.vat_percentage || 0;
                    const vatAmount = doc.vat_amount || 0;
                    const subtotal = doc.subtotal_amount || 0;
                    const currency = doc.currency || "EUR";
                    const vatType = doc.vat_type || "—";
                    
                    return (
                    <TableRow key={doc.document_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {doc.document_number || `#${doc.sequence_number || "—"}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={docTypeLabels[doc.document_type] || doc.document_type}
                          color={docTypeColorMap[doc.document_type] || "default"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {vatType === "inclusive" ? "Inclusive" : vatType === "exclusive" ? "Exclusive" : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {subtotal != null ? `${Number(subtotal).toFixed(2)} ${currency}` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vatAmount != null
                            ? `${Number(vatAmount).toFixed(2)} ${currency} (${vatPercentage}%)`
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {doc.total_amount != null
                            ? `${Number(doc.total_amount).toFixed(2)} ${currency}`
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {doc.created_at ? dayjs(doc.created_at).format("DD/MM/YY HH:mm") : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                            color="text.secondary"
                          >
                            {doc.payment_intent_id
                              ? `${doc.payment_intent_id.substring(0, 16)}...`
                              : "—"}
                          </Typography>
                          {doc.payment_intent_id && (
                            <Tooltip title="Copy payment intent">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyPaymentIntent(doc.payment_intent_id)}
                                sx={{ p: 0.5 }}
                              >
                                <CopyIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.document_id}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
        {totalCount > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </CardContent>
    </Card>
  );
}
