import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { 
  getAllDocuments, 
  DOCUMENT_TYPES,
  downloadInvoice,
  downloadCreditNote,
  resendInvoiceEmail,
  resendCreditNoteEmail,
} from '../../core/apis/financialAPI';
import InvoicePreviewModal from '../../Components/Modals/InvoicePreviewModal';

// Language name mapping
const LANGUAGE_NAMES = {
  en: 'English',
  ro: 'Romanian',
  fr: 'French',
  ar: 'Arabic',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  tr: 'Turkish',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
};

const FinancialPage = () => {
  // Get available locales from environment
  const availableLocales = (import.meta.env.VITE_DEFAULT_LOCALES || 'en,ro,fr,ar')
    .split(',')
    .map(locale => locale.trim())
    .filter(locale => locale);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Data state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Invoice preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Resend email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailLanguage, setEmailLanguage] = useState('en');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Selection state for export
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Applied filters state (to track what was last sent to API)
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    documentType: '',
    documentNumber: '',
    userEmail: '',
  });

  // Fetch documents with current applied filters
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1, // API uses 1-based pagination
        page_size: rowsPerPage,
      };

      // Add filters to request body (server-side filtering)
      if (appliedFilters.startDate) params.start_date = appliedFilters.startDate;
      if (appliedFilters.endDate) params.end_date = appliedFilters.endDate;
      if (appliedFilters.documentType) params.document_type = appliedFilters.documentType;
      if (appliedFilters.documentNumber) params.document_number = appliedFilters.documentNumber;
      if (appliedFilters.userEmail) params.user_email = appliedFilters.userEmail;

      const { data, error: apiError, count } = await getAllDocuments(params);

      if (apiError) {
        setError(apiError);
        toast.error(`Failed to fetch documents: ${apiError}`);
        setDocuments([]);
        setTotalCount(0);
      } else {
        // Ensure data is an array
        const documentsList = Array.isArray(data) ? data : [];
        
        setDocuments(documentsList);
        setTotalCount(count || documentsList.length);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
      toast.error('Failed to fetch financial documents');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, appliedFilters]);

  // Fetch on mount and when pagination or applied filters change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle apply filters - update applied filters and reset to page 1
  const handleApplyFilters = () => {
    setAppliedFilters({
      startDate,
      endDate,
      documentType,
      documentNumber,
      userEmail,
    });
    setPage(0); // Reset to first page when applying new filters
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setDocumentType('');
    setDocumentNumber('');
    setUserEmail('');
    setAppliedFilters({
      startDate: '',
      endDate: '',
      documentType: '',
      documentNumber: '',
      userEmail: '',
    });
    setPage(0);
  };

  // Format currency with proper currency code
  const formatCurrency = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get invoice date from document data
  const getInvoiceDate = (doc) => {
    if (doc.document_type === 'invoice' && doc.data?.invoice?.issue_date) {
      return doc.data.invoice.issue_date;
    }
    if (doc.document_type === 'credit_note' && doc.data?.credit_note?.issue_date) {
      return doc.data.credit_note.issue_date;
    }
    return doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US') : '-';
  };

  // Get document type color
  const getDocumentTypeColor = (type) => {
    return type === DOCUMENT_TYPES.INVOICE ? 'primary' : 'warning';
  };

  // Get document type icon
  const getDocumentTypeIcon = (type) => {
    return type === DOCUMENT_TYPES.INVOICE ? <ReceiptIcon /> : <CreditCardIcon />;
  };

  // Handle open invoice preview modal
  const handleOpenPreviewModal = (doc) => {
    setPreviewDocument(doc);
    setPreviewModalOpen(true);
  };

  // Handle close invoice preview modal
  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewDocument(null);
  };

  // Handle download document
  const handleDownloadDocument = async (doc) => {
    try {
      const isInvoice = doc.document_type === DOCUMENT_TYPES.INVOICE;
      const downloadFunc = isInvoice ? downloadInvoice : downloadCreditNote;
      
      // Get the correct ID from the document data structure
      const documentId = isInvoice 
        ? (doc.data?.invoice?.id || doc.id)
        : (doc.data?.credit_note?.id || doc.id);

      toast.info(`Downloading ${isInvoice ? 'invoice' : 'credit note'}...`);
      
      const { data, error } = await downloadFunc(documentId);
      
      if (error) {
        toast.error(`Failed to download document: ${error}`);
        return;
      }

      // Create blob URL and trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.document_number || documentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download document');
    }
  };

  // Handle open resend email modal
  const handleOpenResendEmailModal = (doc) => {
    setSelectedDocument(doc);
    setEmailAddress(doc.data?.beneficiary?.email || '');
    setEmailLanguage(doc.data?.language || doc.language || 'en');
    setEmailModalOpen(true);
  };

  // Handle close resend email modal
  const handleCloseResendEmailModal = () => {
    setEmailModalOpen(false);
    setSelectedDocument(null);
    setEmailAddress('');
    setEmailLanguage('en'); // Reset to default when closing
    setSendingEmail(false);
  };

  // Handle resend email
  const handleResendEmail = async () => {
    if (!selectedDocument || !emailAddress) {
      toast.error('Email address is required');
      return;
    }

    setSendingEmail(true);

    try {
      const isInvoice = selectedDocument.document_type === DOCUMENT_TYPES.INVOICE;
      const resendFunc = isInvoice ? resendInvoiceEmail : resendCreditNoteEmail;
      
      // Get the correct ID from the document data structure
      const documentId = isInvoice 
        ? (selectedDocument.data?.invoice?.id || selectedDocument.id)
        : (selectedDocument.data?.credit_note?.id || selectedDocument.id);

      const { data, error } = await resendFunc(documentId, {
        email: emailAddress,
        language: emailLanguage,
      });

      if (error) {
        toast.error(`Failed to resend email: ${error}`);
        return;
      }

      toast.success(`Email sent successfully to ${emailAddress}`);
      handleCloseResendEmailModal();
    } catch (err) {
      console.error('Resend email error:', err);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle select all checkbox
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelectAll(true);
      // Select all IDs on current page
      const newSelected = new Set(documents.map((doc) => doc.id));
      setSelectedIds(newSelected);
    } else {
      setSelectAll(false);
      setSelectedIds(new Set());
    }
  };

  // Handle individual checkbox
  const handleSelectClick = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      setSelectAll(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Convert document to CSV row with all nested data
  const documentToCSVRow = (doc) => {
    const data = doc.data || {};
    const isInvoice = doc.document_type === 'invoice';
    
    // Helper to safely get nested values
    const get = (obj, path, defaultValue = '') => {
      const value = path.split('.').reduce((acc, part) => acc?.[part], obj);
      return value !== undefined && value !== null ? value : defaultValue;
    };

    // Helper to escape CSV values
    const escapeCSV = (value) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build comprehensive field list
    const fields = [
      // Document info
      doc.id || '',
      doc.document_number || '',
      // Split document number into Series and Number
      // e.g., "CHLS-00001" -> Series: "CHLS", Number: "00001"
      // e.g., "CHLS-CN-00001" -> Series: "CHLS-CN", Number: "00001"
      (() => {
        const docNum = doc.document_number || '';
        const lastDashIndex = docNum.lastIndexOf('-');
        return lastDashIndex > 0 ? docNum.substring(0, lastDashIndex) : docNum;
      })(),
      (() => {
        const docNum = doc.document_number || '';
        const lastDashIndex = docNum.lastIndexOf('-');
        return lastDashIndex > 0 ? docNum.substring(lastDashIndex + 1) : '';
      })(),
      doc.document_type || '',
      // Accounting ID: Use beneficiary VAT number if exists, otherwise use email
      get(data, 'beneficiary.vat_number') || get(data, 'beneficiary.email'),
      doc.payment_intent_id || '',
      new Date(doc.created_at).toISOString(),
      
      // Invoice/Credit Note specific
      isInvoice ? get(data, 'invoice.invoice_number') : get(data, 'credit_note.credit_note_number'),
      isInvoice ? get(data, 'invoice.issue_date') : get(data, 'credit_note.issue_date'),
      isInvoice ? get(data, 'invoice.due_date') : '',
      get(data, 'credit_note.original_invoice'),
      get(data, 'credit_note.refund_reason'),
      
      // Transaction/Payment from invoice or credit_note
      isInvoice ? get(data, 'invoice.transaction_id') : get(data, 'credit_note.transaction_id'),
      isInvoice ? get(data, 'invoice.payment_method') : get(data, 'credit_note.payment_method'),
      isInvoice ? get(data, 'invoice.payment_status') : '',
      
      // Supplier info
      get(data, 'supplier.name'),
      get(data, 'supplier.address_line1'),
      get(data, 'supplier.address_line2'),
      get(data, 'supplier.city'),
      get(data, 'supplier.postal_code'),
      get(data, 'supplier.country'),
      get(data, 'supplier.vat_number'),
      get(data, 'supplier.registration_number'),
      get(data, 'supplier.email'),
      get(data, 'supplier.phone'),
      get(data, 'supplier.bank_account'),
      
      // Beneficiary info
      get(data, 'beneficiary.name'),
      get(data, 'beneficiary.email'),
      get(data, 'beneficiary.phone'),
      get(data, 'beneficiary.address_line1'),
      get(data, 'beneficiary.address_line2'),
      get(data, 'beneficiary.city'),
      get(data, 'beneficiary.postal_code'),
      get(data, 'beneficiary.country'),
      get(data, 'beneficiary.vat_number'),
      get(data, 'beneficiary.registration_number'),
      get(data, 'beneficiary.bank_account'),
      
      // Financial info
      data.currency || '',
      data.subtotal || 0,
      data.tax_amount || 0,
      data.tax_rate || 0,
      data.total_amount || 0,
      
      // Line items (serialize as JSON for easier parsing)
      data.line_items ? JSON.stringify(data.line_items) : '',
      
      // Additional
      data.language || '',
      data.notes || '',
    ];
    
    return fields.map(escapeCSV).join(',');
  };

  // Export selected documents to CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      let documentsToExport = [];

      if (selectAll) {
        // Fetch all documents with current filters
        toast.info('Fetching all documents for export...');
        
        const params = {
          page: 1,
          page_size: totalCount, // Get all documents
        };

        // Add filters
        if (appliedFilters.startDate) params.start_date = appliedFilters.startDate;
        if (appliedFilters.endDate) params.end_date = appliedFilters.endDate;
        if (appliedFilters.documentType) params.document_type = appliedFilters.documentType;
        if (appliedFilters.documentNumber) params.document_number = appliedFilters.documentNumber;
        if (appliedFilters.userEmail) params.user_email = appliedFilters.userEmail;

        const { data, error } = await getAllDocuments(params);
        
        if (error) {
          toast.error(`Failed to fetch documents: ${error}`);
          return;
        }
        
        documentsToExport = Array.isArray(data) ? data : [];
      } else {
        // Export only selected documents
        documentsToExport = documents.filter(doc => selectedIds.has(doc.id));
      }

      if (documentsToExport.length === 0) {
        toast.warning('No documents to export');
        return;
      }

      // Create CSV content with comprehensive headers
      const headers = [
        // Document info
        'Document ID',
        'Document Number',
        'Series',
        'Number',
        'Document Type',
        'Accounting ID',
        'Payment Intent ID',
        'Created At',
        
        // Invoice/Credit Note specific
        'Invoice/Credit Note Number',
        'Issue Date',
        'Due Date',
        'Original Invoice Number',
        'Refund Reason',
        
        // Transaction/Payment
        'Transaction ID',
        'Payment Method',
        'Payment Status',
        
        // Supplier info
        'Supplier Name',
        'Supplier Address Line 1',
        'Supplier Address Line 2',
        'Supplier City',
        'Supplier Postal Code',
        'Supplier Country',
        'Supplier VAT Number',
        'Supplier Registration Number',
        'Supplier Email',
        'Supplier Phone',
        'Supplier Bank Account',
        
        // Beneficiary info
        'Beneficiary Name',
        'Beneficiary Email',
        'Beneficiary Phone',
        'Beneficiary Address Line 1',
        'Beneficiary Address Line 2',
        'Beneficiary City',
        'Beneficiary Postal Code',
        'Beneficiary Country',
        'Beneficiary VAT Number',
        'Beneficiary Registration Number',
        'Beneficiary Bank Account',
        
        // Financial info
        'Currency',
        'Subtotal',
        'Tax Amount',
        'Tax Rate',
        'Total Amount',
        
        // Line items
        'Line Items (JSON)',
        
        // Additional
        'Language',
        'Notes'
      ].join(',');

      const rows = documentsToExport.map(doc => documentToCSVRow(doc));
      const csvContent = [headers, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `financial_documents_${timestamp}.csv`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${documentsToExport.length} documents to CSV`);
      
      // Clear selection after export
      setSelectedIds(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export documents');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="page-card">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Financial Documents</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(selectedIds.size > 0 || selectAll) && (
            <Button
              variant="contained"
              color="success"
              startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              onClick={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : `Export ${selectAll ? 'All' : selectedIds.size} to CSV`}
            </Button>
          )}
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchDocuments} disabled={loading} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.INVOICE}>Invoice</MenuItem>
                <MenuItem value={DOCUMENT_TYPES.CREDIT_NOTE}>Credit Note</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Document Number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Search by number..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="User Email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Search by user email..."
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                Apply Filters
              </Button>
              <Button variant="outlined" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Documents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.size > 0 && selectedIds.size < documents.length && !selectAll}
                  checked={selectAll || (documents.length > 0 && selectedIds.size === documents.length)}
                  onChange={handleSelectAllClick}
                  disabled={documents.length === 0}
                />
              </TableCell>
              <TableCell>Document Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>Payment Intent</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Loading documents...</Typography>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    No financial documents found. Try adjusting your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} hover selected={selectedIds.has(doc.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onChange={() => handleSelectClick(doc.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getDocumentTypeIcon(doc.document_type)}
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        sx={{ 
                          color: 'primary.main',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          '&:hover': {
                            color: 'primary.dark',
                          }
                        }}
                        onClick={() => handleOpenPreviewModal(doc)}
                      >
                        {doc.document_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.document_type.replace('_', ' ')}
                      color={getDocumentTypeColor(doc.document_type)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {doc.data?.beneficiary?.email || doc.data?.beneficiary?.name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getInvoiceDate(doc)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {doc.payment_intent_id ? `${doc.payment_intent_id.substring(0, 15)}...` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(doc.data?.subtotal, doc.data?.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(doc.data?.tax_amount, doc.data?.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(doc.data?.total_amount, doc.data?.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(doc.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Resend Email">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleOpenResendEmailModal(doc)}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* Resend Email Dialog */}
      <Dialog 
        open={emailModalOpen} 
        onClose={handleCloseResendEmailModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Resend {selectedDocument?.document_type === DOCUMENT_TYPES.INVOICE ? 'Invoice' : 'Credit Note'} Email
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="recipient@example.com"
              required
              helperText="Enter the email address where the document should be sent"
            />
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={emailLanguage}
                onChange={(e) => setEmailLanguage(e.target.value)}
                label="Language"
              >
                {availableLocales.map((locale) => (
                  <MenuItem key={locale} value={locale}>
                    {LANGUAGE_NAMES[locale] || locale.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedDocument && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Document Details:
                </Typography>
                <Typography variant="body2">
                  <strong>Number:</strong> {selectedDocument.document_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedDocument.document_type.replace('_', ' ')}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> {formatCurrency(selectedDocument.data?.total_amount, selectedDocument.data?.currency)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResendEmailModal} disabled={sendingEmail}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleResendEmail}
            disabled={sendingEmail || !emailAddress}
            startIcon={sendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        open={previewModalOpen}
        onClose={handleClosePreviewModal}
        document={previewDocument}
      />
    </Card>
  );
};

export default FinancialPage;
