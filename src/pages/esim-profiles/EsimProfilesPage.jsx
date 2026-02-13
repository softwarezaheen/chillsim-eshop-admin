import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Card,
  FormControl,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Filters from "../../Components/Filters/Filters";
import { getEsimProfiles, syncConsumption } from "../../core/apis/esimProfilesAPI";

function EsimRow({ profile, onSync }) {
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleCopyLPA = () => {
    const lpaUri = `LPA:1$${profile.smdp_address}$${profile.activation_code}`;
    navigator.clipboard.writeText(lpaUri);
    toast.success('LPA URI copied to clipboard');
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncConsumption(profile.iccid);
    
    if (result.success) {
      toast.success(result.message);
      onSync(); // Refresh the list
    } else {
      toast.error(`Sync failed: ${result.error}`);
    }
    setSyncing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'active': return 'success';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getBundleStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'queued': return 'info';
      case 'active': return 'success';
      case 'depleted': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatData = (mb) => {
    if (mb === null || mb === undefined) return 'Unlimited';
    if (mb >= 1000) return `${(mb / 1000).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="bold">{profile.iccid}</Typography>
            {profile.user_email && (
              <Typography variant="caption" color="text.secondary">
                {profile.user_email}
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip 
            label={profile.profile_status || 'delivered'} 
            color={getStatusColor(profile.profile_status)} 
            size="small" 
          />
        </TableCell>
        <TableCell>{profile.bundles?.length || 0}</TableCell>
        <TableCell>{formatDate(profile.profile_expiry_date)}</TableCell>
        <TableCell>{formatDate(profile.last_consumption_sync)}</TableCell>
        <TableCell>{formatDate(profile.created_at)}</TableCell>
        <TableCell>
          <Tooltip title="Sync Consumption">
            <IconButton 
              color="primary" 
              onClick={handleSync} 
              disabled={syncing}
              size="small"
            >
              {syncing ? <CircularProgress size={20} /> : <SyncIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              {/* LPA URI for troubleshooting */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    LPA URI (for manual installation)
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    LPA:1${profile.smdp_address}${profile.activation_code}
                  </Typography>
                </Box>
                <Tooltip title="Copy LPA URI">
                  <IconButton onClick={handleCopyLPA} size="small" color="primary">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="h6" gutterBottom component="div">
                Bundles ({profile.bundles?.length || 0})
              </Typography>
              {profile.bundles && profile.bundles.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider Order ID</TableCell>
                      <TableCell>Bundle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Data Usage</TableCell>
                      <TableCell>Started At</TableCell>
                      <TableCell>Validity End</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.bundles.map((bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell component="th" scope="row">
                          {bundle.esim_hub_order_id || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box>
                            {bundle.bundle_name && (
                              <Typography variant="body2" fontWeight="bold">
                                {bundle.bundle_name}
                              </Typography>
                            )}
                            {bundle.bundle_description && (
                              <Typography variant="caption" color="text.secondary">
                                {bundle.bundle_description}
                              </Typography>
                            )}
                            {!bundle.bundle_name && !bundle.bundle_description && (
                              <Typography variant="body2">{bundle.bundle_type}</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={bundle.bundle_status || 'pending'} 
                            color={getBundleStatusColor(bundle.bundle_status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {formatData(bundle.data_used_mb)} / {formatData(bundle.data_allocated_mb)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatData(bundle.data_remaining_mb)} remaining
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(bundle.started_at)}</TableCell>
                        <TableCell>{formatDate(bundle.validity_end_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No bundles found
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function EsimProfilesPage() {
  const [loading, setLoading] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    iccid: "",
    user_email: "",
    profile_status: "",
    created_from: "",
    created_to: "",
    page: 1,
    pageSize: 20,
  });

  const [search, setSearch] = useState({ 
    iccid: "", 
    user_email: "",
    profile_status: "",
    created_from: "",
    created_to: ""
  });
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState([]);
  const [statistics, setStatistics] = useState({
    active_profiles: 0,
    pending_profiles: 0,
    expired_profiles: 0,
    total_data_allocated_mb: 0,
    total_data_used_mb: 0,
    unlimited_bundles_count: 0,
    avg_usage_percentage: 0,
    early_expiration_count: 0,
    no_activation_count: 0
  });

  const getProfiles = useCallback(() => {
    setLoading(true);

    try {
      const { iccid, user_email, profile_status, created_from, created_to, page, pageSize } = searchQueries;
      getEsimProfiles({
        page,
        pageSize,
        iccid: iccid || undefined,
        user_email: user_email || undefined,
        profile_status: profile_status || undefined,
        created_from: created_from || undefined,
        created_to: created_to || undefined,
      })
        .then((res) => {
          if (res?.error) {
            toast.error(res?.error);
            setLoading(false);
            setData([]);
            setTotalRows(0);
            setTotalPages(1);
          } else {
            setTotalRows(res?.count || 0);
            setTotalPages(res?.total_pages || 1);
            setData(res?.data || []);
            setStatistics(res?.statistics || {
              active_profiles: 0,
              pending_profiles: 0,
              expired_profiles: 0,
              total_data_allocated_mb: 0,
              total_data_used_mb: 0,
              unlimited_bundles_count: 0,
              avg_usage_percentage: 0,
              early_expiration_count: 0,
              no_activation_count: 0
            });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      toast.error(e?.message || "Failed to load eSIM profiles");
      setLoading(false);
    }
  }, [searchQueries]);

  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  const resetFilters = () => {
    setSearchQueries({ iccid: "", user_email: "", profile_status: "", created_from: "", created_to: "", page: 1, pageSize: 20 });
    setSearch({ iccid: "", user_email: "", profile_status: "", created_from: "", created_to: "" });
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      iccid: search.iccid,
      user_email: search.user_email,
      profile_status: search.profile_status,
      created_from: search.created_from,
      created_to: search.created_to,
      page: 1, // Reset to first page when filtering
    });
  };

  const handlePageChange = (event, newPage) => {
    setSearchQueries({ ...searchQueries, page: newPage + 1 }); // MUI uses 0-indexed, API uses 1-indexed
  };

  const handleRowsPerPageChange = (event) => {
    setSearchQueries({
      ...searchQueries,
      pageSize: parseInt(event.target.value, 10),
      page: 1,
    });
  };

  const tableHeaders = [
    { name: "" }, // Expand icon
    { name: "ICCID" },
    { name: "Profile Status" },
    { name: "Bundles" },
    { name: "Profile Expiry" },
    { name: "Last Sync" },
    { name: "Created At" },
    { name: "Actions" },
  ];

  return (
    <Card className="page-card">
      <Filters
        onReset={resetFilters}
        onApply={applyFilter}
        applyDisable={!search.iccid && !search.user_email && !search.profile_status && !search.created_from && !search.created_to}
      >
        <Grid container size={{ xs: 12 }} spacing={2}>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-iccid">
                Search ICCID
              </label>
              <TextField
                id="search-iccid"
                value={search.iccid}
                onChange={(e) => setSearch({ ...search, iccid: e.target.value })}
                placeholder="Enter ICCID..."
                InputProps={{
                  startAdornment: <SearchIcon className="mr-2" />,
                }}
              />
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="search-email">
                User Email
              </label>
              <TextField
                id="search-email"
                value={search.user_email}
                onChange={(e) => setSearch({ ...search, user_email: e.target.value })}
                placeholder="Enter user email..."
                InputProps={{
                  startAdornment: <SearchIcon className="mr-2" />,
                }}
              />
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Profile Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={search.profile_status}
                label="Profile Status"
                onChange={(e) =>
                  setSearch({ ...search, profile_status: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="created-from">
                Created From
              </label>
              <TextField
                id="created-from"
                type="datetime-local"
                value={search.created_from}
                onChange={(e) => setSearch({ ...search, created_from: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </Grid>

          <Grid item size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <label className="mb-2" htmlFor="created-to">
                Created To
              </label>
              <TextField
                id="created-to"
                type="datetime-local"
                value={search.created_to}
                onChange={(e) => setSearch({ ...search, created_to: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
      </Filters>

      {/* Statistics Cards */}
      <Box sx={{ px: 2, py: 2 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#e8f5e9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">📱</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Active</Typography>
                  <Typography variant="h6" fontWeight="bold">{statistics.active_profiles}</Typography>
                  <Typography variant="caption" color="text.secondary">of {totalRows}</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#e3f2fd' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">💾</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Allocated</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {(statistics.total_data_allocated_mb / 1000).toFixed(1)} GB
                    {statistics.unlimited_bundles_count > 0 && ` ∞ (${statistics.unlimited_bundles_count})`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">All bundles</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#fce4ec' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">📊</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Consumed</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {(statistics.total_data_used_mb / 1000).toFixed(1)} GB
                  </Typography>
                  <Typography variant="caption" color="text.secondary">All bundles</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#fff3e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">📈</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Avg. Usage</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statistics.avg_usage_percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Activated</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#ffebee' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">⏱️</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">Early Exp.</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statistics.early_expiration_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Before full</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{ p: 1.5, bgcolor: '#f5f5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5">❌</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">No Activation</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {statistics.no_activation_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Never used</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">eSIM Profiles ({totalRows})</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={getProfiles} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                {tableHeaders.map((header, index) => (
                  <TableCell key={index}>{header.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((profile) => (
                  <EsimRow 
                    key={profile.id} 
                    profile={profile} 
                    onSync={getProfiles}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No eSIM profiles found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalRows}
            page={searchQueries.page - 1} // MUI uses 0-indexed
            onPageChange={handlePageChange}
            rowsPerPage={searchQueries.pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </>
      )}
    </Card>
  );
}

export default EsimProfilesPage;
