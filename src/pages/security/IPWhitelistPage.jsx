import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  getMyIp,
  getWhitelistStatus,
  setWhitelistStatus,
  listWhitelist,
  createWhitelistEntry,
  updateWhitelistEntry,
  deleteWhitelistEntry,
} from "../../core/apis/ipWhitelistAPI";

export default function IPWhitelistPage() {
  const [myIp, setMyIp] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addIp, setAddIp] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [confirmToggle, setConfirmToggle] = useState(null); // true = enabling, false = disabling
  const [deleteConfirm, setDeleteConfirm] = useState(null); // entry id

  const myIpWhitelisted = entries.some(
    (e) => e.is_active && e.ip_address === myIp
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ipRes, statusRes, listRes] = await Promise.all([
        getMyIp(),
        getWhitelistStatus(),
        listWhitelist(),
      ]);
      setMyIp(ipRes.data?.data?.ip ?? null);
      setEnabled(statusRes.data?.data?.enabled ?? false);
      setEntries(listRes.data?.data ?? []);
    } catch {
      // errors surface via console; UI stays usable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── toggle ──────────────────────────────────────────────────────────────────
  const handleToggleRequest = () => {
    // Enabling while own IP not listed → force confirmation warning
    setConfirmToggle(!enabled);
  };

  const handleToggleConfirm = async () => {
    setConfirmToggle(null);
    setToggleLoading(true);
    try {
      await setWhitelistStatus(!enabled);
      setEnabled((prev) => !prev);
    } catch {
      // noop
    } finally {
      setToggleLoading(false);
    }
  };

  // ── add entry ────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setAddError("");
    if (!addIp.trim()) {
      setAddError("IP address is required.");
      return;
    }
    setAddLoading(true);
    try {
      await createWhitelistEntry(addIp.trim(), addDesc.trim() || undefined);
      setAddIp("");
      setAddDesc("");
      setAddOpen(false);
      await fetchAll();
    } catch (err) {
      setAddError(
        err?.response?.data?.detail || "Failed to add entry. Check the IP format."
      );
    } finally {
      setAddLoading(false);
    }
  };

  // ── toggle single entry active flag ─────────────────────────────────────────
  const handleEntryToggle = async (entry) => {
    try {
      await updateWhitelistEntry(entry.id, { is_active: !entry.is_active });
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_active: !e.is_active } : e))
      );
    } catch {
      // noop
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeleteConfirm(null);
    try {
      await deleteWhitelistEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // noop
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={900}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Admin IP Whitelist
      </Typography>

      {/* ── Status card ─────────────────────────────────────────────────── */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Whitelist Enforcement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When enabled, only IP addresses in the list below can access the admin interface.
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                label={enabled ? "ENABLED" : "DISABLED"}
                color={enabled ? "error" : "default"}
                size="small"
                sx={{ fontWeight: 700 }}
              />
              {toggleLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Tooltip
                  title={
                    !enabled && !myIpWhitelisted
                      ? "Add your IP to the list first to avoid locking yourself out"
                      : ""
                  }
                >
                  <span>
                    <Switch
                      checked={enabled}
                      onChange={handleToggleRequest}
                      color="error"
                    />
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Current IP indicator */}
          <Box mt={2} display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Your current IP:
            </Typography>
            <Chip
              label={myIp ?? "unknown"}
              size="small"
              color={myIpWhitelisted ? "success" : "warning"}
              variant="outlined"
            />
            {myIpWhitelisted ? (
              <Typography variant="caption" color="success.main">
                ✓ whitelisted
              </Typography>
            ) : (
              <Typography variant="caption" color="warning.main">
                ⚠ not in list
              </Typography>
            )}
          </Box>

          {/* Lockout warning */}
          {!enabled && !myIpWhitelisted && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Your IP <strong>{myIp}</strong> is not in the whitelist. Add it before enabling
              enforcement — otherwise you will lock yourself out immediately.
            </Alert>
          )}

          {enabled && !myIpWhitelisted && (
            <Alert severity="error" sx={{ mt: 2 }}>
              ⚠️ Your IP <strong>{myIp}</strong> is NOT in the whitelist but enforcement is active.
              Add your IP below or you may lose access on your next session.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Entry table ─────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Allowed IP Addresses ({entries.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => { setAddOpen(true); setAddError(""); }}
        >
          Add IP
        </Button>
      </Box>

      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>IP / CIDR</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="center"><strong>Active</strong></TableCell>
              <TableCell><strong>Added</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No entries yet. Add at least your own IP before enabling enforcement.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                sx={{
                  bgcolor: entry.ip_address === myIp ? "action.selected" : undefined,
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace">
                      {entry.ip_address}
                    </Typography>
                    {entry.ip_address === myIp && (
                      <Chip label="you" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {entry.description || "—"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Switch
                    checked={entry.is_active}
                    onChange={() => handleEntryToggle(entry)}
                    size="small"
                    color="success"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString()
                      : "—"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm(entry.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add dialog ──────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add IP to Whitelist</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField
            label="IP Address or CIDR"
            placeholder="e.g. 1.2.3.4  or  192.168.0.0/24"
            value={addIp}
            onChange={(e) => setAddIp(e.target.value)}
            fullWidth
            size="small"
            inputProps={{ style: { fontFamily: "monospace" } }}
            helperText={`Your current IP is ${myIp ?? "unknown"}`}
          />
          <TextField
            label="Description (optional)"
            placeholder="e.g. Office, Home, VPN"
            value={addDesc}
            onChange={(e) => setAddDesc(e.target.value)}
            fullWidth
            size="small"
          />
          {addError && <Alert severity="error">{addError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={addLoading}
            startIcon={addLoading ? <CircularProgress size={16} /> : null}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toggle confirmation dialog ───────────────────────────────────── */}
      <Dialog open={confirmToggle !== null} onClose={() => setConfirmToggle(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmToggle ? "Enable IP Whitelist?" : "Disable IP Whitelist?"}
        </DialogTitle>
        <DialogContent>
          {confirmToggle ? (
            <>
              {!myIpWhitelisted && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Your IP <strong>{myIp}</strong> is NOT in the whitelist.
                  Enabling now will block your own access immediately.
                </Alert>
              )}
              <Typography variant="body2">
                Once enabled, any admin request from an IP that is not in the whitelist will
                receive a 403 Unauthorized response, including your own if not listed.
              </Typography>
            </>
          ) : (
            <Typography variant="body2">
              Disabling whitelist enforcement allows any IP to reach the admin interface
              (still protected by the admin API key).
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggle(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmToggle ? "error" : "primary"}
            onClick={handleToggleConfirm}
          >
            {confirmToggle ? "Enable anyway" : "Disable"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────────── */}
      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove IP?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This IP will no longer be in the whitelist.
            {enabled && entries.find((e) => e.id === deleteConfirm)?.ip_address === myIp && (
              <Box component="span" color="error.main" fontWeight={700}>
                {" "}Warning: this is your current IP. Removing it while enforcement is active
                will block your own access.
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDelete(deleteConfirm)}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
