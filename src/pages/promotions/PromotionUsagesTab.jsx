import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import Filters from '../../Components/Filters/Filters';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const PromotionUsagesTab = ({
  usages,
  loading,
  page,
  pageSize,
  totalRows,
  filters,
  setFilters,
  setPage,
  setPageSize,
  handlePageChange,
  handlePageSizeChange,
}) => {
  return (
    <>
      <Filters
        onReset={() => {
          setFilters({});
          setPage(0);
        }}
        onApply={() => {
          setPage(0);
        }}
        applyDisable={false}
      >
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', alignItems: 'flex-end', marginBottom: 12 }}>
            <TextField
              label="Promotion Code"
              value={filters.promotion_code || ''}
              onChange={(e) => setFilters({ ...filters, promotion_code: e.target.value })}
              size="medium"
              placeholder="Search by code"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              style={{ minWidth: 180, height: 48 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                displayEmpty
                size="medium"
                style={{ height: 48 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </div>
            <CustomDatePicker
              label="Created From"
              value={filters.created_from || null}
              onChange={(date) => setFilters({ ...filters, created_from: date })}
            />
            <CustomDatePicker
              label="Created To"
              value={filters.created_to || null}
              onChange={(date) => setFilters({ ...filters, created_to: date })}
            />
          </div>
        </div>
      </Filters>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Promotion Code</TableCell>
              <TableCell>Bundle</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : usages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No usages found
                </TableCell>
              </TableRow>
            ) : (
              usages.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>{usage.promotion_code}</TableCell>
                  <TableCell>{usage.bundle?.name || ''}</TableCell>
                  <TableCell>{usage.amount}</TableCell>
                  <TableCell>{usage.status}</TableCell>
                  <TableCell>{new Date(usage.created_at).toLocaleString()}</TableCell>
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
        onPageChange={handlePageChange}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handlePageSizeChange}
      />
    </>
  );
};

export default PromotionUsagesTab;