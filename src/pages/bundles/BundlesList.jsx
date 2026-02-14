import { Visibility, Download, Upload, Edit, Save, Close, Refresh, CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  Grid2,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Switch,
  TableCell,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel
} from "@mui/material";
import { useTheme } from "@mui/styles";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import BundleDetail from "../../Components/page-component/bundles/BundleDetail";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import { 
  getAdminBundles, 
  updateBundlePrice, 
  exportBundlesCsv, 
  importBundlePrices,
  bulkUpdateBundles,
  rebuildBundleCache,
  syncBundlesNow,
  refreshTagData
} from "../../core/apis/bundlesAPI";
import { COUNTRIES } from "../../data/countries";

const BundleList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [openDetail, setOpenDetail] = useState({ open: false, data: null });
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [editingRow, setEditingRow] = useState(null); // bundle_code of row being edited
  const [editValues, setEditValues] = useState({ price: "", admin_active: null });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rebuildingCache, setRebuildingCache] = useState(false);
  const [syncingBundles, setSyncingBundles] = useState(false);
  const [refreshingTags, setRefreshingTags] = useState(false);
  const [syncConfirmDialog, setSyncConfirmDialog] = useState(false);
  
  // Selection state
  const [selectedBundles, setSelectedBundles] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkMarkupDialog, setBulkMarkupDialog] = useState(false);
  const [markupPercentage, setMarkupPercentage] = useState("");
  
  const [searchQueries, setSearchQueries] = useState({
    search: "",
    is_active: null,       // null = all, true = provider active, false = provider inactive
    admin_active: null,    // null = all, true = admin active, false = admin inactive
    below_margin: null,    // null = all, "negative" = <0%, "below_20" = <20%, "below_50" = <50%
    country_search: "",    // ISO2 code filter
    min_data_gb: null,
    max_data_gb: null,
    min_validity_days: null,
    max_validity_days: null,
    order_by: "price",     // Sort column
    order_direction: "ASC", // Sort direction
    pageSize: 25,
    page: 0,
  });

  // Debounced state for filter inputs
  const [filterInputs, setFilterInputs] = useState({
    min_data_gb: "",
    max_data_gb: "",
    min_validity_days: "",
    max_validity_days: "",
  });

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Debounced update function
  const updateSearchWithDebounce = useCallback((updates) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQueries(prev => ({ ...prev, ...updates, page: 0 }));
    }, 500); // 500ms debounce
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
  };

  const getBundles = useCallback(async () => {
    setLoading(true);

    try {
      const { 
        search: searchTerm, page, pageSize, is_active, admin_active, below_margin, country_search,
        min_data_gb, max_data_gb, min_validity_days, max_validity_days, order_by, order_direction
      } = searchQueries;

      const result = await getAdminBundles({
        search: searchTerm,
        is_active,
        admin_active,
        margin_threshold: below_margin,
        country_search,
        min_data_gb,
        max_data_gb,
        min_validity_days,
        max_validity_days,
        order_by,
        order_direction,
        limit: pageSize,
        offset: page * pageSize,
      });

      if (result?.error) {
        toast.error(result?.error || "Failed to load bundles");
        setData([]);
        setTotalRows(0);
      } else {
        setTotalRows(result?.totalCount || 0);
        setData(result?.data || []);
      }
    } catch (e) {
      toast.error(e?.message || "Failed to display data");
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [searchQueries]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    getBundles();
  }, [getBundles]);

  const resetFilters = () => {
    setSearchQueries({
      search: "",
      is_active: null,
      admin_active: null,
      below_margin: null,
      country_search: "",
      min_data_gb: null,
      max_data_gb: null,
      min_validity_days: null,
      max_validity_days: null,
      order_by: "price",
      order_direction: "ASC",
      pageSize: 25,
      page: 0,
    });
    setFilterInputs({
      min_data_gb: "",
      max_data_gb: "",
      min_validity_days: "",
      max_validity_days: "",
    });
    setSearch("");
  };

  // Handle inline editing
  const startEditing = (bundle) => {
    setEditingRow(bundle.bundle_code);
    setEditValues({
      price: bundle.price?.toString() || "",
      admin_active: bundle.admin_active,
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditValues({ price: "", admin_active: null });
  };

  const saveEditing = async (bundle) => {
    try {
      const updates = {};
      
      // Check if price changed
      const newPrice = parseFloat(editValues.price);
      if (!isNaN(newPrice) && newPrice !== bundle.price) {
        if (newPrice <= 0) {
          toast.error("Price must be greater than 0");
          return;
        }
        updates.price = newPrice;
      }
      
      // Check if admin_active changed
      if (editValues.admin_active !== bundle.admin_active) {
        updates.admin_active = editValues.admin_active;
      }
      
      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save");
        cancelEditing();
        return;
      }
      
      await updateBundlePrice(bundle.bundle_code, updates);
      toast.success(`Bundle ${bundle.bundle_code} updated successfully`);
      cancelEditing();
      getBundles(); // Refresh data
    } catch (e) {
      toast.error(e?.message || "Failed to update bundle");
    }
  };

  // Handle admin_active toggle (quick toggle without entering edit mode)
  const handleAdminActiveToggle = async (bundle) => {
    try {
      await updateBundlePrice(bundle.bundle_code, {
        admin_active: !bundle.admin_active,
      });
      toast.success(`Bundle ${bundle.bundle_code} ${!bundle.admin_active ? 'activated' : 'deactivated'}`);
      getBundles();
    } catch (e) {
      toast.error(e?.message || "Failed to toggle bundle status");
    }
  };

  // Handle CSV export
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBundlesCsv({
        search: searchQueries.search,
        is_active: searchQueries.is_active,
        admin_active: searchQueries.admin_active,
        margin_threshold: searchQueries.below_margin,  // Renamed parameter
        country_search: searchQueries.country_search,
      });
      toast.success("Bundles exported successfully");
    } catch (e) {
      toast.error(e?.message || "Failed to export bundles");
    } finally {
      setExporting(false);
    }
  };

  // Handle CSV import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Handle cache rebuild
  const handleRebuildCache = async () => {
    if (!window.confirm('Rebuild bundle cache? This will update prices on the frontend/app within 1-2 minutes.')) {
      return;
    }
    
    setRebuildingCache(true);
    try {
      await rebuildBundleCache();
      toast.success('Bundle cache rebuild initiated successfully');
      getBundles(); // Refresh data
    } catch (e) {
      toast.error(e?.message || 'Failed to rebuild cache');
    } finally {
      setRebuildingCache(false);
    }
  };

  // Handle tag data refresh
  const handleRefreshTagData = async () => {
    if (!window.confirm('Refresh tag data from eSIM Hub? This will fix stale country codes and zone names in tag.data and tag_translation.data.')) {
      return;
    }
    
    setRefreshingTags(true);
    try {
      const result = await refreshTagData();
      toast.success(`Tag data refreshed: ${result?.data?.countries_updated || 0} countries, ${result?.data?.regions_updated || 0} regions, ${result?.data?.translations_updated || 0} translations updated`);
      getBundles(); // Refresh data
    } catch (e) {
      toast.error(e?.message || 'Failed to refresh tag data');
    } finally {
      setRefreshingTags(false);
    }
  };

  // Handle bundle sync
  const handleSyncBundles = () => {
    setSyncConfirmDialog(true);
  };

  const handleConfirmSync = async () => {
    setSyncConfirmDialog(false);
    setSyncingBundles(true);
    try {
      await syncBundlesNow();
      toast.success('Bundle sync started in background. Check logs for progress.');
    } catch (e) {
      toast.error(e?.message || 'Failed to trigger sync');
    } finally {
      setSyncingBundles(false);
    }
  };

  // Handle column sorting
  const handleSort = (sortKey) => {
    if (!sortKey) return;
    
    const newDirection = 
      searchQueries.order_by === sortKey && searchQueries.order_direction.toLowerCase() === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSearchQueries({
      ...searchQueries,
      order_by: sortKey,
      order_direction: newDirection.toUpperCase(), // Backend expects uppercase
      page: 0, // Reset to first page when sorting
    });
  };

  // Handle bundle selection
  const handleSelectBundle = (bundleCode) => {
    const newSelected = new Set(selectedBundles);
    if (newSelected.has(bundleCode)) {
      newSelected.delete(bundleCode);
    } else {
      newSelected.add(bundleCode);
    }
    setSelectedBundles(newSelected);
    setSelectAll(false); // Uncheck "select all" when individual selection changes
  };

  // Handle select all on current page
  const handleSelectAllPage = () => {
    if (selectedBundles.size === data.length && data.length > 0) {
      // Deselect all on current page
      setSelectedBundles(new Set());
      setSelectAll(false);
    } else {
      // Select all on current page
      const newSelected = new Set(data.map(bundle => bundle.bundle_code));
      setSelectedBundles(newSelected);
      setSelectAll(false);
    }
  };

  // Handle select all across all results
  const handleSelectAllResults = async () => {
    try {
      // Fetch all bundle IDs with current filters
      const result = await getAdminBundles({
        search: searchQueries.search,
        is_active: searchQueries.is_active,
        admin_active: searchQueries.admin_active,
        margin_threshold: searchQueries.below_margin,
        country_search: searchQueries.country_search,
        min_data_gb: searchQueries.min_data_gb,
        max_data_gb: searchQueries.max_data_gb,
        min_validity_days: searchQueries.min_validity_days,
        max_validity_days: searchQueries.max_validity_days,
        order_by: searchQueries.order_by,
        order_direction: searchQueries.order_direction,
        limit: 10000, // Get all
        offset: 0,
      });
      
      if (result?.data) {
        const allBundleCodes = result.data.map(bundle => bundle.bundle_code);
        setSelectedBundles(new Set(allBundleCodes));
        setSelectAll(true);
        toast.info(`Selected all ${allBundleCodes.length} bundles across all pages`);
      }
    } catch (e) {
      toast.error("Failed to select all bundles");
    }
  };

  // Bulk activate bundles
  const handleBulkActivate = async () => {
    if (selectedBundles.size === 0) {
      toast.warning("No bundles selected");
      return;
    }

    if (!window.confirm(`Activate ${selectedBundles.size} selected bundle(s)?`)) {
      return;
    }

    try {
      const result = await bulkUpdateBundles({
        bundle_ids: Array.from(selectedBundles),
        action: 'activate',
      });

      if (result?.data) {
        toast.success(`Activated ${result.data.successful} of ${result.data.total_processed} bundles`);
        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} bundles failed to activate`);
        }
      }

      setSelectedBundles(new Set());
      setSelectAll(false);
      getBundles();
    } catch (e) {
      toast.error(e?.message || "Failed to activate bundles");
    }
  };

  // Bulk deactivate bundles
  const handleBulkDeactivate = async () => {
    if (selectedBundles.size === 0) {
      toast.warning("No bundles selected");
      return;
    }

    if (!window.confirm(`Deactivate ${selectedBundles.size} selected bundle(s)?`)) {
      return;
    }

    try {
      const result = await bulkUpdateBundles({
        bundle_ids: Array.from(selectedBundles),
        action: 'deactivate',
      });

      if (result?.data) {
        toast.success(`Deactivated ${result.data.successful} of ${result.data.total_processed} bundles`);
        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} bundles failed to deactivate`);
        }
      }

      setSelectedBundles(new Set());
      setSelectAll(false);
      getBundles();
    } catch (e) {
      toast.error(e?.message || "Failed to deactivate bundles");
    }
  };

  // Bulk apply markup
  const handleBulkMarkup = async () => {
    if (selectedBundles.size === 0) {
      toast.warning("No bundles selected");
      return;
    }

    setBulkMarkupDialog(true);
  };

  // Execute bulk markup after dialog confirmation
  const executeBulkMarkup = async () => {
    const markup = parseFloat(markupPercentage);
    
    if (isNaN(markup) || markup < 0 || markup > 1000) {
      toast.error("Please enter a valid markup percentage between 0 and 1000");
      return;
    }

    setBulkMarkupDialog(false);

    try {
      const result = await bulkUpdateBundles({
        bundle_ids: Array.from(selectedBundles),
        action: 'markup',
        markup_percentage: markup,
      });

      if (result?.data) {
        toast.success(`Applied ${markup}% markup to ${result.data.successful} of ${result.data.total_processed} bundles`);
        if (result.data.failed > 0) {
          toast.warning(`${result.data.failed} bundles failed - check if they have provider_price set`);
        }
      }

      setSelectedBundles(new Set());
      setSelectAll(false);
      setMarkupPercentage("");
      getBundles();
    } catch (e) {
      toast.error(e?.message || "Failed to apply markup");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    try {
      const result = await importBundlePrices(file);
      const data = result?.data;
      
      if (data?.failed > 0) {
        toast.warning(
          `Import completed: ${data.successful}/${data.total_processed} successful, ${data.failed} failed`
        );
        // Show first few errors
        data.errors?.slice(0, 3).forEach(err => {
          toast.error(`Row ${err.row}: ${err.error}`, { autoClose: 5000 });
        });
      } else {
        toast.success(`Successfully imported ${data?.successful} bundles`);
      }
      
      getBundles(); // Refresh data
    } catch (e) {
      toast.error(e?.message || "Failed to import bundle prices");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Format margin display with color
  const formatMargin = (margin, marginAmount) => {
    if (margin === null || margin === undefined) {
      return <Typography variant="body2" color="text.secondary">N/A</Typography>;
    }
    
    const isNegative = margin < 0;
    const color = isNegative ? "error" : margin < 10 ? "warning" : "success";
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography 
          variant="body2" 
          color={`${color}.main`}
          sx={{ fontWeight: isNegative ? 'bold' : 'normal' }}
        >
          {margin.toFixed(1)}%
        </Typography>
        {marginAmount !== null && (
          <Typography variant="caption" color="text.secondary">
            €{marginAmount.toFixed(2)}
          </Typography>
        )}
      </Box>
    );
  };

  const tableHeaders = useMemo(() => [
    { 
      name: "Select", 
      minWidth: "60px", 
      sorted: null,
      customContent: (
        <Checkbox
          checked={selectedBundles.size > 0 && selectedBundles.size === data.length}
          indeterminate={selectedBundles.size > 0 && selectedBundles.size < data.length}
          onChange={handleSelectAllPage}
        />
      )
    },
    { name: "Bundle ID", minWidth: "150px", sorted: null },
    { name: "Provider Code", minWidth: "150px", sorted: null },
    { name: "Name", minWidth: "200px", sorted: "name" },
    { name: "Selling Price (€)", minWidth: "130px", sorted: "price" },
    { name: "Provider Price (€)", minWidth: "130px", sorted: "provider_price" },
    { name: "Margin", minWidth: "100px", sorted: "margin" },
    { name: "Provider Active", minWidth: "100px", sorted: "is_active" },
    { name: "Admin Active", minWidth: "100px", sorted: "admin_active" },
    { name: "Data Amount", minWidth: "100px", sorted: "data_amount" },
    { name: "Validity", minWidth: "100px", sorted: "validity" },
    { name: "Countries", minWidth: "80px", sorted: null },
    { name: "Actions", minWidth: "120px", sorted: null },
  ], [selectedBundles, data, handleSelectAllPage]);

  return (
    <Card className="page-card">
      {/* Import file input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />
      
      {/* Action Buttons - Top Right */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Tooltip title="Export filtered bundles to CSV">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </Tooltip>
        <Tooltip title="Import bundle prices and admin status from CSV">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Upload />}
            onClick={handleImportClick}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import CSV"}
          </Button>
        </Tooltip>
        <Tooltip title="Rebuild cache to apply price changes to frontend/app">
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<Refresh />}
            onClick={handleRebuildCache}
            disabled={rebuildingCache}
          >
            {rebuildingCache ? "Rebuilding..." : "Rebuild Cache"}
          </Button>
        </Tooltip>
        <Tooltip title="Refresh tag data to fix stale country codes from eSIM Hub">
          <Button
            variant="contained"
            size="small"
            color="success"
            startIcon={<Refresh />}
            onClick={handleRefreshTagData}
            disabled={refreshingTags}
          >
            {refreshingTags ? "Refreshing..." : "Refresh Tag Data"}
          </Button>
        </Tooltip>
        <Tooltip title="Trigger bundle sync from eSIM Hub (runs daily at 3 AM automatically)">
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Refresh />}
            onClick={handleSyncBundles}
            disabled={syncingBundles}
          >
            {syncingBundles ? "Syncing..." : "Sync Bundles"}
          </Button>
        </Tooltip>
      </Box>

      <Filters
        filterButtons={
          <Button 
            variant="text" 
            onClick={resetFilters}
            sx={{ textTransform: 'none' }}
          >
            Clear filters
          </Button>
        }
      >
        <Grid2 container size={{ xs: 12 }} spacing={2}>
          <Grid2 item size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-input">
                Search
              </label>
              <TextField
                id="search-input"
                fullWidth
                required
                size="small"
                placeholder="Bundle code or name"
                type="text"
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                    autoComplete: "new-password",
                    form: {
                      autoComplete: "off",
                    },
                  },
                }}
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);
                  updateSearchWithDebounce({ search: value });
                }}
              />
            </FormControl>
          </Grid2>
          
          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth>
              <label className="mb-2">Country</label>
              <Autocomplete
                fullWidth
                size="small"
                options={COUNTRIES}
                getOptionLabel={(option) => `${option.flag} ${option.name}`}
                value={COUNTRIES.find(c => c.code === searchQueries.country_search) || null}
                onChange={(event, newValue) => {
                  setSearchQueries({
                    ...searchQueries,
                  country_search: newValue?.code || "",
                  page: 0,
                });
              }}
              slotProps={{
                popper: {
                  style: { width: 'fit-content' }
                }
              }}
              renderInput={(params) => <TextField {...params} placeholder="All Countries" />}
              renderOption={(props, option) => (
                <li {...props} key={option.code}>
                  {option.flag} {option.name} ({option.code})
                </li>
              )}
            />
            </FormControl>
          </Grid2>
          
          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth>
              <label className="mb-2">Provider Status</label>
              <Select
                size="small"
                value={searchQueries.is_active === null ? "" : searchQueries.is_active.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQueries({
                    ...searchQueries,
                    is_active: val === "" ? null : val === "true",
                    page: 0,
                  });
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          
          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth>
              <label className="mb-2">Admin Status</label>
              <Select
                size="small"
                value={searchQueries.admin_active === null ? "" : searchQueries.admin_active.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQueries({
                    ...searchQueries,
                    admin_active: val === "" ? null : val === "true",
                    page: 0,
                  });
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          
          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth>
              <label className="mb-2">Margin</label>
              <Select
                size="small"
                value={searchQueries.below_margin || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQueries({
                    ...searchQueries,
                    below_margin: val === "" ? null : val,
                    page: 0,
                  });
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="negative">🔴 Negative Margin (&lt;0%)</MenuItem>
                <MenuItem value="below_20">🟡 Low Margin (0-20%)</MenuItem>
                <MenuItem value="below_50">🟠 Medium Margin (20-50%)</MenuItem>
              </Select>
            </FormControl>
          </Grid2>

          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <label className="mb-2">Data Amount (GB)</label>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                type="number"
                placeholder="Min"
                value={filterInputs.min_data_gb}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterInputs(prev => ({ ...prev, min_data_gb: value }));
                  updateSearchWithDebounce({
                    min_data_gb: value ? parseFloat(value) : null,
                  });
                }}
                sx={{ width: '50%' }}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Max"
                value={filterInputs.max_data_gb}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterInputs(prev => ({ ...prev, max_data_gb: value }));
                  updateSearchWithDebounce({
                    max_data_gb: value ? parseFloat(value) : null,
                  });
                }}
                sx={{ width: '50%' }}
              />
            </Box>
          </Grid2>

          <Grid2 item size={{ xs: 12, sm: 2 }}>
            <label className="mb-2">Validity (Days)</label>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                type="number"
                placeholder="Min"
                value={filterInputs.min_validity_days}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterInputs(prev => ({ ...prev, min_validity_days: value }));
                  updateSearchWithDebounce({
                    min_validity_days: value ? parseInt(value) : null,
                  });
                }}
                sx={{ width: '50%' }}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Max"
                value={filterInputs.max_validity_days}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterInputs(prev => ({ ...prev, max_validity_days: value }));
                  updateSearchWithDebounce({
                    max_validity_days: value ? parseInt(value) : null,
                  });
                }}
                sx={{ width: '50%' }}
              />
            </Box>
          </Grid2>
        </Grid2>
        
      </Filters>

      {/* Summary stats */}
      <Box sx={{ px: 2, py: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Total: <strong>{totalRows}</strong> bundles
        </Typography>
        {searchQueries.below_margin === 'negative' && (
          <Chip 
            label="⚠️ Showing only negative margin bundles" 
            color="error" 
            size="small" 
            variant="outlined"
          />
        )}
        {searchQueries.below_margin === 'below_20' && (
          <Chip 
            label="🟡 Showing only 0-20% margin bundles" 
            color="warning" 
            size="small" 
            variant="outlined"
          />
        )}
        {searchQueries.below_margin === 'below_50' && (
          <Chip 
            label="🟠 Showing only 20-50% margin bundles" 
            color="info" 
            size="small" 
            variant="outlined"
          />
        )}
      </Box>

      {/* Bulk Actions Toolbar */}
      {selectedBundles.size > 0 && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {selectedBundles.size} bundle(s) selected
          </Typography>
          {!selectAll && selectedBundles.size === data.length && totalRows > data.length && (
            <Button 
              size="small" 
              variant="text" 
              onClick={handleSelectAllResults}
            >
              Select all {totalRows} bundles
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={handleBulkActivate}
          >
            Activate
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleBulkDeactivate}
          >
            Deactivate
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleBulkMarkup}
          >
            Set Markup
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setSelectedBundles(new Set());
              setSelectAll(false);
            }}
          >
            Clear Selection
          </Button>
        </Box>
      )}

      <TableComponent
        loading={loading}
        dataPerPage={searchQueries?.pageSize}
        tableData={data}
        tableHeaders={tableHeaders}
        requestSort={handleSort}
        orderBy={searchQueries.order_direction?.toLowerCase() || 'asc'}
        sortedBy={searchQueries.order_by}
        actions={false}
      >
        {data?.map((el) => {
          const isEditing = editingRow === el.bundle_code;
          const hasNegativeMargin = el.margin !== null && el.margin < 0;
          
          return (
            <RowComponent 
              key={el.bundle_code} 
              actions={false}
              sx={hasNegativeMargin ? { backgroundColor: 'rgba(255, 0, 0, 0.05)' } : {}}
            >
              {/* Selection Checkbox */}
              <TableCell sx={{ minWidth: "60px" }}>
                <Checkbox
                  checked={selectedBundles.has(el.bundle_code)}
                  onChange={() => handleSelectBundle(el.bundle_code)}
                />
              </TableCell>

              {/* Bundle ID */}
              <TableCell sx={{ minWidth: "150px" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title={el.bundle_code} placement="top">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {el.bundle_code}
                    </Typography>
                  </Tooltip>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(el.bundle_code, 'Bundle ID')}
                    sx={{ padding: '2px' }}
                  >
                    <Tooltip title="Copy Bundle ID" placement="top">
                      <Box component="span" sx={{ fontSize: '14px' }}>📋</Box>
                    </Tooltip>
                  </IconButton>
                </Box>
              </TableCell>

              {/* Provider Code */}
              <TableCell sx={{ minWidth: "150px" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title={el.bundle_info_code || 'N/A'} placement="top">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {el.bundle_info_code || 'N/A'}
                    </Typography>
                  </Tooltip>
                  {el.bundle_info_code && (
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(el.bundle_info_code, 'Provider Code')}
                      sx={{ padding: '2px' }}
                    >
                      <Tooltip title="Copy Provider Code" placement="top">
                        <Box component="span" sx={{ fontSize: '14px' }}>📋</Box>
                      </Tooltip>
                    </IconButton>
                  )}
                </Box>
              </TableCell>
              
              {/* Name */}
              <TableCell sx={{ minWidth: "200px", maxWidth: "250px" }}>
                <Tooltip title={el.name} placement="top">
                  <Typography variant="body2" noWrap>
                    {el.name || "N/A"}
                  </Typography>
                </Tooltip>
              </TableCell>
              
              {/* Selling Price */}
              <TableCell sx={{ minWidth: "130px" }}>
                {isEditing ? (
                  <TextField
                    size="small"
                    type="number"
                    value={editValues.price}
                    onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    sx={{ width: '100px' }}
                    inputProps={{ step: "0.01", min: "0.01" }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    sx={{ fontWeight: 'medium', color: hasNegativeMargin ? 'error.main' : 'inherit' }}
                  >
                    €{el.price?.toFixed(2) || "0.00"}
                  </Typography>
                )}
              </TableCell>
              
              {/* Provider Price */}
              <TableCell sx={{ minWidth: "130px" }}>
                <Typography variant="body2" color="text.secondary">
                  {el.provider_price !== null ? `€${el.provider_price.toFixed(2)}` : "N/A"}
                </Typography>
              </TableCell>
              
              {/* Margin */}
              <TableCell sx={{ minWidth: "100px" }}>
                {formatMargin(el.margin, el.margin_amount)}
              </TableCell>
              
              {/* Provider Active */}
              <TableCell sx={{ minWidth: "100px" }}>
                <Chip
                  label={el.is_active ? "Active" : "Inactive"}
                  color={el.is_active ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              
              {/* Admin Active */}
              <TableCell sx={{ minWidth: "100px" }}>
                {isEditing ? (
                  <Switch
                    checked={editValues.admin_active}
                    onChange={(e) => setEditValues({ ...editValues, admin_active: e.target.checked })}
                    color="primary"
                    size="small"
                  />
                ) : (
                  <Switch
                    checked={el.admin_active}
                    onChange={() => handleAdminActiveToggle(el)}
                    color="primary"
                    size="small"
                    disabled={!el.is_active} // Can't activate if provider is inactive
                  />
                )}
              </TableCell>
              
              {/* Data Amount */}
              <TableCell sx={{ minWidth: "100px" }}>
                <Typography variant="body2">
                  {el.data_amount || "N/A"}
                </Typography>
              </TableCell>

              {/* Validity */}
              <TableCell sx={{ minWidth: "100px" }}>
                <Typography variant="body2">
                  {el.duration || "N/A"}
                </Typography>
              </TableCell>
              
              {/* Countries */}
              <TableCell sx={{ minWidth: "80px" }}>
                <Tooltip 
                  title={typeof el.country_codes === 'string' ? el.country_codes : (el.country_codes || "N/A")} 
                  placement="top"
                >
                  <Chip label={el.countries_count} size="small" variant="outlined" />
                </Tooltip>
              </TableCell>
              
              {/* Actions */}
              <TableCell sx={{ minWidth: "120px" }}>
                {isEditing ? (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Save" placement="top">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => saveEditing(el)}
                      >
                        <Save fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancel" placement="top">
                      <IconButton
                        color="default"
                        size="small"
                        onClick={cancelEditing}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit Price" placement="top">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => startEditing(el)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Detail" placement="top">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => setOpenDetail({ open: true, data: el })}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </TableCell>
            </RowComponent>
          );
        })}
      </TableComponent>
      
      <TablePagination
        component="div"
        count={totalRows || 0}
        page={searchQueries?.page}
        onPageChange={(value, page) =>
          setSearchQueries({ ...searchQueries, page: page })
        }
        rowsPerPage={searchQueries?.pageSize}
        onRowsPerPageChange={(e) => {
          setSearchQueries({ ...searchQueries, pageSize: parseInt(e.target.value, 10), page: 0 });
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {openDetail?.open && (
        <BundleDetail
          onClose={() => setOpenDetail({ open: false, data: null })}
          bundle={{
            bundle_code: openDetail?.data?.bundle_code,
            display_title: openDetail?.data?.name,
            name: openDetail?.data?.name,
            price: openDetail?.data?.price,
            price_display: `€${openDetail?.data?.price?.toFixed(2) || '0.00'}`,
            provider_price: openDetail?.data?.provider_price,
            margin: openDetail?.data?.margin,
            is_active: openDetail?.data?.is_active,
            admin_active: openDetail?.data?.admin_active,
            gprs_limit_display: openDetail?.data?.data_amount || 'N/A',
            validity_display: openDetail?.data?.duration || 'N/A',
            countries_count: openDetail?.data?.countries_count,
            country_codes: openDetail?.data?.country_codes,
            plan_type: openDetail?.data?.plan_type || 'Data only',
            activity_policy: openDetail?.data?.activity_policy || 'The validity period starts when the eSIM connects to any supported networks.',
            icon: '',
          }}
        />
      )}

      {/* Markup Percentage Dialog */}
      <Dialog open={bulkMarkupDialog} onClose={() => setBulkMarkupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Markup Percentage</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Markup Percentage"
            value={markupPercentage}
            onChange={(e) => setMarkupPercentage(e.target.value)}
            helperText="Enter markup percentage (0-1000%). This will set price = provider_price × (1 + markup/100)"
            fullWidth
            autoFocus
            margin="normal"
            inputProps={{ min: 0, max: 1000, step: 0.1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkMarkupDialog(false)}>Cancel</Button>
          <Button onClick={executeBulkMarkup} variant="contained" color="primary">
            Apply Markup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Bundles Confirmation Dialog */}
      <Dialog
        open={syncConfirmDialog}
        onClose={() => setSyncConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main'
        }}>
          ⚠️ Sync Bundles Now?
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" gutterBottom>
              This will trigger an immediate sync with eSIM Hub to update all bundle data.
            </Typography>
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'warning.light', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ⚠️ Warning:
              </Typography>
              <Typography variant="body2">
                Running bundle sync during peak hours may temporarily increase API response times 
                and affect user experience. This operation will:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Typography component="li" variant="body2">
                  Sync all bundles from eSIM Hub
                </Typography>
                <Typography component="li" variant="body2">
                  Update provider prices and availability
                </Typography>
                <Typography component="li" variant="body2">
                  Send margin alert email to support
                </Typography>
                <Typography component="li" variant="body2">
                  Run in background (check logs for progress)
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Note: This sync runs automatically every day at 3:00 AM.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setSyncConfirmDialog(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSync}
            variant="contained"
            color="error"
            disabled={syncingBundles}
          >
            Yes, Sync Now
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default BundleList;