import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  TablePagination,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import Filters from '../../Components/Filters/Filters';
import CustomDatePicker from '../../Components/CustomDatePicker';
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';

const PromotionCodesTab = ({
  promotions,
  loading,
  page,
  pageSize,
  totalRows,
  setPage,
  setPageSize,
  handlePageChange,
  handlePageSizeChange,
  onFetchPromotions,
  onAddPromotion,
  onExpirePromotion,
  onBulkGenerate,
  onExportCsv,
  selectedPromotions,
  setSelectedPromotions,
  selectAll,
  setSelectAll,
  onBulkExpire,
  onBulkEditValidity,
  onEditPromotion,
}) => {
  const [filters, setFilters] = useState({});
  
  // Fetch promotions when page/pageSize changes
  useEffect(() => {
    onFetchPromotions(filters);
  }, [page, pageSize]);
  
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

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const currentPageIds = promotions.map(p => p.id);
      setSelectedPromotions(currentPageIds);
      setSelectAll(false); // Just select current page
    } else {
      setSelectedPromotions([]);
      setSelectAll(false);
    }
  };

  const handleSelectOne = (id) => {
    setSelectAll(false);
    if (selectedPromotions.includes(id)) {
      setSelectedPromotions(selectedPromotions.filter(selectedId => selectedId !== id));
    } else {
      setSelectedPromotions([...selectedPromotions, id]);
    }
  };

  const handleSelectAllMatching = () => {
    setSelectAll(true);
    setSelectedPromotions([]); // Clear current page selection when selecting all
  };

  const selectedCount = selectAll ? totalRows : selectedPromotions.length;
  const allCurrentPageSelected = promotions.length > 0 && promotions.every(p => selectedPromotions.includes(p.id));

  return (
    <>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onBulkGenerate}
            sx={{ whiteSpace: 'nowrap' }}
          >
            🎟️ Bulk Generate
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={onAddPromotion}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Single Code
          </Button>
        </Box>
      </Box>

      <Filters
        onReset={() => {
          setFilters({});
          setPage(0);
          setSelectedPromotions([]);
          setSelectAll(false);
          onFetchPromotions({});
        }}
        onApply={() => {
          setPage(0);
          setSelectedPromotions([]);
          setSelectAll(false);
          onFetchPromotions(filters);
        }}
        applyDisable={false}
        filterStyles={{
          borderRadius: "16px",
          paddingBottom: 2,
        }}
      >
        <Box sx={{ width: '100%' }}>
          {/* First Row: Search and Dropdowns */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <TextField
              label="Code"
              value={filters.code || ''}
              onChange={(e) => setFilters({ ...filters, code: e.target.value })}
              size="small"
              placeholder="Search by code"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Active Status</InputLabel>
              <Select
                value={filters.is_active !== undefined ? filters.is_active : ''}
                onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                label="Active Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={true}>✅ Active</MenuItem>
                <MenuItem value={false}>❌ Inactive</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Promotion Type</InputLabel>
              <Select
                value={filters.promo_type || ''}
                onChange={(e) => setFilters({ ...filters, promo_type: e.target.value })}
                label="Promotion Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="PROMOTION">🎫 Manual</MenuItem>
                <MenuItem value="BULK">🎟️ Bulk Generated</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Second Row: Valid Date Range */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
              Valid Date Range
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
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
            </Box>
          </Box>

          {/* Third Row: Created Date Range */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
              Created Date Range
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
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
            </Box>
          </Box>
        </Box>
      </Filters>

      {/* Bulk Actions Bar - appears between filters and table when items are selected */}
      {selectedCount > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" fontWeight="bold">
              {selectedCount} promotion{selectedCount !== 1 ? 's' : ''} selected
            </Typography>
            {!selectAll && selectedPromotions.length > 0 && totalRows > selectedPromotions.length && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleSelectAllMatching}
              >
                Select all {totalRows} matching promos
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="success" 
              size="small"
              onClick={() => onExportCsv(filters)}
            >
              📥 Export CSV
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={() => onBulkEditValidity(filters)}
            >
              Edit Validity
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={() => onBulkExpire(filters)}
            >
              Expire
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setSelectedPromotions([]);
                setSelectAll(false);
              }}
            >
              Clear Selection
            </Button>
          </Box>
        </Paper>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedPromotions.length > 0 && !allCurrentPageSelected && !selectAll}
                  checked={selectAll || allCurrentPageSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
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
                <TableCell colSpan={11} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No promotions found
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((promo) => (
                <TableRow key={promo.id} style={getRowStyle(promo)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectAll || selectedPromotions.includes(promo.id)}
                      onChange={() => handleSelectOne(promo.id)}
                    />
                  </TableCell>
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
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit promotion">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEditPromotion(promo)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!isExpired(promo) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onExpirePromotion(promo.code)}
                        >
                          Expire
                        </Button>
                      )}
                      {isExpired(promo) && (
                        <span style={{ color: '#666', fontSize: '12px', alignSelf: 'center' }}>Expired</span>
                      )}
                    </Box>
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