import React, { useState } from 'react';
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
  setPage,
  setPageSize,
  handlePageChange,
  handlePageSizeChange,
}) => {
  const [filters, setFilters] = useState({});
  
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
              placeholder="Search by promotion code"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              style={{ minWidth: 180, height: 48 }}
            />
            <TextField
              label="Referral Code"
              value={filters.referral_code || ''}
              onChange={(e) => setFilters({ ...filters, referral_code: e.target.value })}
              size="medium"
              placeholder="Search by referral code"
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
                <MenuItem value="completed">Completed</MenuItem>
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
              <TableCell>User Email</TableCell>
              <TableCell>Promotion Code</TableCell>
              <TableCell>Referral Code</TableCell>
              <TableCell>Bundle</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : usages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No usages found
                </TableCell>
              </TableRow>
            ) : (
              usages.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>{usage.user?.email || 'N/A'}</TableCell>
                  <TableCell>{usage.promotion_code || 'N/A'}</TableCell>
                  <TableCell>{usage.referral_code || 'N/A'}</TableCell>
                  <TableCell>
                    {usage.bundle_id ? (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {usage.bundle?.bundle_name || 'Unknown Bundle'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {usage.bundle_id}
                        </div>
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{usage.amount || 0}</TableCell>
                  <TableCell>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: 
                        usage.status === 'completed' ? '#4caf50' :
                        usage.status === 'pending' ? '#ff9800' :
                        usage.status === 'failed' ? '#f44336' : '#9e9e9e'
                    }}>
                      {usage.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </TableCell>
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
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </>
  );
};

export default PromotionUsagesTab;