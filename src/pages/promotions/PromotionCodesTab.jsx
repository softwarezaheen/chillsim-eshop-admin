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
import { TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';

const PromotionCodesTab = ({
  promotions,
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
  onAddPromotion,
  onExpirePromotion,
}) => {
  const isExpired = (promotion) => {
    const now = new Date();
    const validTo = promotion.valid_to ? new Date(promotion.valid_to) : null;
    return !promotion.is_active || (validTo && validTo < now);
  };

  const getRowStyle = (promotion) => {
    if (isExpired(promotion)) {
      return { backgroundColor: '#f5f5f5' }; // Grey background for expired
    } else {
      return { backgroundColor: '#e8f5e8' }; // Light green background for valid
    }
  };
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div />
        <Button variant="contained" color="primary" onClick={onAddPromotion}>
          Add Promotion
        </Button>
      </div>
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
              label="Code"
              value={filters.code || ''}
              onChange={(e) => setFilters({ ...filters, code: e.target.value })}
              size="medium"
              placeholder="Search by code"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              style={{ minWidth: 180, height: 48 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
              <InputLabel>Active</InputLabel>
              <Select
                value={filters.is_active || ''}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                displayEmpty
                size="medium"
                style={{ height: 48 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </div>
            <CustomDatePicker
              label="Valid From"
              value={filters.valid_from || null}
              onChange={(date) => setFilters({ ...filters, valid_from: date })}
            />
            <CustomDatePicker
              label="Valid To"
              value={filters.valid_to || null}
              onChange={(date) => setFilters({ ...filters, valid_to: date })}
            />
          </div>
        </div>
      </Filters>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Rule Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid To</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Times Used</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No promotions found
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((promo) => (
                <TableRow key={promo.id} style={getRowStyle(promo)}>
                  <TableCell>{promo.code}</TableCell>
                  <TableCell>{promo.name}</TableCell>
                  <TableCell>
                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {promo.promotion_rule?.rule_description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>{promo.type}</TableCell>
                  <TableCell>{promo.amount}</TableCell>
                  <TableCell>{promo.valid_from ? new Date(promo.valid_from).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{promo.valid_to ? new Date(promo.valid_to).toLocaleDateString() : ''}</TableCell>
                  <TableCell>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: promo.is_active ? '#4caf50' : '#f44336'
                    }}>
                      {promo.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </TableCell>
                  <TableCell>{promo.times_used}</TableCell>
                  <TableCell>
                    {!isExpired(promo) && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => onExpirePromotion(promo.code)}
                        style={{ marginRight: 8 }}
                      >
                        Expire
                      </Button>
                    )}
                    {isExpired(promo) && (
                      <span style={{ color: '#666', fontSize: '12px' }}>Expired</span>
                    )}
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
        onPageChange={handlePageChange}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handlePageSizeChange}
      />
    </>
  );
};

export default PromotionCodesTab;