import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
        <TableCell>{profile.iccid}</TableCell>
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
              <Typography variant="h6" gutterBottom component="div">
                Bundles ({profile.bundles?.length || 0})
              </Typography>
              {profile.bundles && profile.bundles.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Allocated</TableCell>
                      <TableCell>Used</TableCell>
                      <TableCell>Remaining</TableCell>
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
                        <TableCell>{bundle.bundle_type}</TableCell>
                        <TableCell>
                          <Chip 
                            label={bundle.bundle_status || 'pending'} 
                            color={getBundleStatusColor(bundle.bundle_status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatData(bundle.data_allocated_mb)}</TableCell>
                        <TableCell>{formatData(bundle.data_used_mb)}</TableCell>
                        <TableCell>{formatData(bundle.data_remaining_mb)}</TableCell>
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
    profile_status: "",
    page: 1,
    pageSize: 20,
  });

  const [search, setSearch] = useState({ iccid: "", profile_status: "" });
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState([]);

  const getProfiles = useCallback(() => {
    setLoading(true);

    try {
      const { iccid, profile_status, page, pageSize } = searchQueries;
      getEsimProfiles({
        page,
        pageSize,
        iccid: iccid || undefined,
        profile_status: profile_status || undefined,
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
    setSearchQueries({ iccid: "", profile_status: "", page: 1, pageSize: 20 });
    setSearch({ iccid: "", profile_status: "" });
  };

  const applyFilter = () => {
    setSearchQueries({
      ...searchQueries,
      iccid: search.iccid,
      profile_status: search.profile_status,
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
        applyDisable={!search.iccid && !search.profile_status}
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
        </Grid>
      </Filters>

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
