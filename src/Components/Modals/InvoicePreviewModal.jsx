import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import './InvoicePreviewModal.scss';

const InvoicePreviewModal = ({ open, onClose, document }) => {
  if (!document) return null;

  const isInvoice = document.document_type === 'invoice';
  const docData = document.data;
  const currentYear = new Date().getFullYear();

  // Calculate tax percentage
  const calculateTaxPercentage = () => {
    if (isInvoice && docData?.subtotal && docData?.tax_amount) {
      return Math.round((docData.tax_amount / docData.subtotal) * 100);
    }
    if (!isInvoice && docData?.credit_note?.subtotal && docData?.credit_note?.tax) {
      return Math.round((docData.credit_note.tax / docData.credit_note.subtotal) * 100);
    }
    return 0;
  };

  const renderInvoice = () => (
    <div className="invoice-preview">
      {/* Header Section */}
      <div className="invoice-header">
        <div className="invoice-title">
          <h1>INVOICE</h1>
          <div className="invoice-details">
            <div><strong>Invoice Number:</strong> {document.document_number}</div>
            <div><strong>Issued Date:</strong> {docData?.invoice?.issue_date || new Date(document.created_at).toLocaleDateString()}</div>
            <div><strong>Due Date:</strong> {docData?.invoice?.due_date || new Date(document.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="logo-section">
          <img src="https://chillsim.net/logo/logo.png" alt="ChillSIM Logo" />
        </div>
      </div>

      {/* Parties Section */}
      <div className="parties-section">
        {/* Supplier */}
        <div className="party-info">
          <h3>From (Supplier)</h3>
          <div><strong>{docData?.supplier?.name || 'ChillSIM'}</strong></div>
          <div>{docData?.supplier?.address_line1 || 'Splaiul Unirii 152'}</div>
          {docData?.supplier?.address_line2 && <div>{docData.supplier.address_line2}</div>}
          <div>{docData?.supplier?.city || 'Bucharest'} {docData?.supplier?.postal_code || '040301'}</div>
          {docData?.supplier?.state && <div>{docData.supplier.state}</div>}
          <div>{docData?.supplier?.country || 'Romania'}</div>
          {docData?.supplier?.vat_number && <div><strong>VAT:</strong> {docData.supplier.vat_number}</div>}
          {docData?.supplier?.registration_number && <div><strong>Reg. Number:</strong> {docData.supplier.registration_number}</div>}
          <div><strong>Email:</strong> {docData?.supplier?.email || 'contact@chillsim.net'}</div>
          {docData?.supplier?.phone && <div><strong>Phone:</strong> {docData.supplier.phone}</div>}
          {docData?.supplier?.bank_account && <div><strong>Bank Account:</strong> {docData.supplier.bank_account}</div>}
        </div>

        {/* Beneficiary */}
        <div className="party-info">
          <h3>To (Beneficiary)</h3>
          <div><strong>{docData?.beneficiary?.name || 'Customer'}</strong></div>
          {docData?.beneficiary?.vat_number && <div><strong>VAT:</strong> {docData.beneficiary.vat_number}</div>}
          {docData?.beneficiary?.registration_number && <div><strong>Reg. Number:</strong> {docData.beneficiary.registration_number}</div>}
          {docData?.beneficiary?.address_line1 && <div>{docData.beneficiary.address_line1}</div>}
          {docData?.beneficiary?.address_line2 && <div>{docData.beneficiary.address_line2}</div>}
          {docData?.beneficiary?.city && <div>{docData.beneficiary.city}</div>}
          {docData?.beneficiary?.state && <div>{docData.beneficiary.state}</div>}
          {docData?.beneficiary?.postal_code && <div>{docData.beneficiary.postal_code}</div>}
          {docData?.beneficiary?.country && <div>{docData.beneficiary.country}</div>}
          <div><strong>Email:</strong> {docData?.beneficiary?.email || '-'}</div>
          {docData?.beneficiary?.phone && <div><strong>Phone:</strong> {docData.beneficiary.phone}</div>}
        </div>
      </div>

      {/* Amount Summary */}
      <div className="amount-summary">
        {docData?.total_amount} {docData?.currency} Due on {docData?.invoice?.due_date || new Date(document.created_at).toLocaleDateString()}
      </div>

      {/* Payment Information */}
      {docData?.invoice && (
        <div className="payment-info">
          <h3>✅ Payment Confirmed</h3>
          <div><strong>Payment Information:</strong></div>
          <div>{docData.invoice.payment_method || 'Paid via Stripe'}</div>
          {docData.invoice.transaction_id && <div><strong>Transaction ID:</strong> {docData.invoice.transaction_id}</div>}
        </div>
      )}

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
            <th style={{ width: '150px', textAlign: 'right' }}>Amount (excl. tax)</th>
          </tr>
        </thead>
        <tbody>
          {docData?.line_items?.map((item, index) => (
            <tr key={index}>
              <td>{item.description}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity || 1}</td>
              <td style={{ textAlign: 'right' }}>{item.price || item.amount} {docData?.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="totals-row">
          <span className="label">Subtotal:</span>
          <span className="amount">{docData?.subtotal} {docData?.currency}</span>
        </div>
        {docData?.tax_amount && (
          <div className="totals-row">
            <span className="label">Tax ({calculateTaxPercentage()}%):</span>
            <span className="amount">{docData.tax_amount} {docData?.currency}</span>
          </div>
        )}
        <div className="totals-row total">
          <span className="label">Total Amount:</span>
          <span className="amount">{docData?.total_amount} {docData?.currency}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>This is an automatically generated invoice.</p>
        <p>© {currentYear} ChillSIM. All rights reserved.</p>
      </div>
    </div>
  );

  const renderCreditNote = () => (
    <div className="invoice-preview credit-note">
      {/* Header Section */}
      <div className="invoice-header">
        <div className="invoice-title">
          <h1>CREDIT NOTE</h1>
          <div className="invoice-details">
            <div><strong>Credit Note Number:</strong> {document.document_number}</div>
            <div><strong>Issue Date:</strong> {docData?.credit_note?.issue_date || new Date(document.created_at).toLocaleDateString()}</div>
            {docData?.credit_note?.original_invoice && (
              <div><strong>Original Invoice:</strong> {docData.credit_note.original_invoice}</div>
            )}
            {docData?.credit_note?.refund_reason && (
              <div><strong>Reason:</strong> {docData.credit_note.refund_reason}</div>
            )}
          </div>
        </div>
        <div className="logo-section">
          <img src="https://www.chillsim.net/logo/logo.png" alt="ChillSIM Logo" />
        </div>
      </div>

      {/* Parties Section */}
      <div className="parties-section">
        {/* Supplier */}
        <div className="party-info">
          <h3>From (Supplier)</h3>
          <div><strong>{docData?.supplier?.name || 'ChillSIM'}</strong></div>
          <div>{docData?.supplier?.address_line1 || 'Splaiul Unirii 152'}</div>
          {docData?.supplier?.address_line2 && <div>{docData.supplier.address_line2}</div>}
          <div>{docData?.supplier?.city || 'Bucharest'} {docData?.supplier?.postal_code || '040301'}</div>
          {docData?.supplier?.state && <div>{docData.supplier.state}</div>}
          <div>{docData?.supplier?.country || 'Romania'}</div>
          {docData?.supplier?.vat_number && <div><strong>VAT:</strong> {docData.supplier.vat_number}</div>}
          {docData?.supplier?.registration_number && <div><strong>Reg. Number:</strong> {docData.supplier.registration_number}</div>}
          <div><strong>Email:</strong> {docData?.supplier?.email || 'contact@chillsim.net'}</div>
          {docData?.supplier?.phone && <div><strong>Phone:</strong> {docData.supplier.phone}</div>}
          {docData?.supplier?.bank_account && <div><strong>Bank Account:</strong> {docData.supplier.bank_account}</div>}
        </div>

        {/* Beneficiary */}
        <div className="party-info">
          <h3>To (Beneficiary)</h3>
          <div><strong>{docData?.beneficiary?.name || 'Customer'}</strong></div>
          {docData?.beneficiary?.vat_number && <div><strong>VAT:</strong> {docData.beneficiary.vat_number}</div>}
          {docData?.beneficiary?.registration_number && <div><strong>Reg. Number:</strong> {docData.beneficiary.registration_number}</div>}
          {docData?.beneficiary?.address_line1 && <div>{docData.beneficiary.address_line1}</div>}
          {docData?.beneficiary?.address_line2 && <div>{docData.beneficiary.address_line2}</div>}
          {docData?.beneficiary?.city && <div>{docData.beneficiary.city}</div>}
          {docData?.beneficiary?.state && <div>{docData.beneficiary.state}</div>}
          {docData?.beneficiary?.postal_code && <div>{docData.beneficiary.postal_code}</div>}
          {docData?.beneficiary?.country && <div>{docData.beneficiary.country}</div>}
          <div><strong>Email:</strong> {docData?.beneficiary?.email || '-'}</div>
          {docData?.beneficiary?.phone && <div><strong>Phone:</strong> {docData.beneficiary.phone}</div>}
        </div>
      </div>

      {/* Credit Note Information Box */}
      <div className="credit-note-info">
        <h3>Notes</h3>
        <p>{docData?.credit_note?.refund_reason || 'This credit note represents a refund or adjustment to the original invoice. The amounts shown are negative values indicating credits to be returned.'}</p>
      </div>

      {/* Payment Information */}
      {docData?.credit_note && (
        <div className="payment-info">
          <h3>✅ Original Payment</h3>
          <div><strong>Payment Information:</strong></div>
          <div>{docData.credit_note.payment_method || 'Paid via Stripe'}</div>
          {docData.credit_note.transaction_id && <div><strong>Transaction ID:</strong> {docData.credit_note.transaction_id}</div>}
        </div>
      )}

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="text-right">Quantity</th>
            <th className="text-right">Unit Price</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {docData?.line_items?.map((item, index) => (
            <tr key={index}>
              <td>{item.description}</td>
              <td className="text-right">{item.quantity || 1}</td>
              <td className="text-right negative-amount">{item.unit_price || item.price} {docData?.currency}</td>
              <td className="text-right negative-amount">{item.price || item.amount} {docData?.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section credit-note-totals">
        <div className="totals-row">
          <span className="label">Subtotal:</span>
          <span className="amount negative-amount">{docData?.subtotal} {docData?.currency}</span>
        </div>
        <div className="totals-row">
          <span className="label">Tax ({calculateTaxPercentage()}%):</span>
          <span className="amount negative-amount">{docData?.tax_amount} {docData?.currency}</span>
        </div>
        <div className="totals-row total-refund">
          <span className="label">Total Refund:</span>
          <span className="amount">{docData?.total_amount} {docData?.currency}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Thank you for your business. If you have any questions, please contact us.</p>
        <p>© {currentYear} ChillSIM. All rights reserved.</p>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <span>{isInvoice ? 'Invoice' : 'Credit Note'} Preview - original can be downloaded (language may differ)</span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
          {isInvoice ? renderInvoice() : renderCreditNote()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoicePreviewModal;
