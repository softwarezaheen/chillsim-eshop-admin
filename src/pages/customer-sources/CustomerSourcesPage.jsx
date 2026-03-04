import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Collapse,
  CircularProgress,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  InfoOutlined as InfoIcon,
  Replay as ReplayIcon,
} from "@mui/icons-material";
import {
  getCustomerSources,
  runAttributionBackfill,
} from "../../core/apis/attributionAPI";
import CustomerSourceForm from "./CustomerSourceForm";
import { toast } from "react-toastify";

// Hardcoded priority order — mirrors _match_source() in attribution_service.py exactly.
// Update BOTH if the logic ever changes.
const PRIORITY_SLUGS = [
  "referral",
  "affiliate_network",
  "employee",
  "independent_affiliate",
  "partner_benefits",
  "paid_advertising",
  "organic",
];

const PRIORITY_STEPS = [
  { step: 1, label: "Referral code on the order", slug: "referral" },
  { step: 2, label: "Affiliate network click (Impact.com tracking)", slug: "affiliate_network" },
  { step: 3, label: "Employee recommendation promo code (matched via detection rules)", slug: "employee" },
  { step: 4, label: "Independent affiliate promo code (matched via detection rules)", slug: "independent_affiliate" },
  { step: 5, label: "Partner / Benefits voucher used within 30 days of the order", slug: "partner_benefits" },
  { step: 6, label: "Promo code present + UTM source → Paid Advertising sub-source", slug: null },
  { step: 7, label: "Promo code present + no UTM → Organic (found us naturally, used a code)", slug: null },
  { step: 8, label: "UTM source present (no promo/referral/affiliate) → Paid Advertising sub-source", slug: "paid_advertising" },
  { step: 9, label: "No signals detected → Organic (fallback)", slug: "organic" },
];

export default function CustomerSourcesPage() {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [parentId, setParentId] = useState(null);

  // Priority info widget
  const [priorityOpen, setPriorityOpen] = useState(false);

  // Backfill dialog state
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillDryRun, setBackfillDryRun] = useState(false);
  const [backfillForce, setBackfillForce] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    const result = await getCustomerSources();
    if (!result.error) {
      setSources(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSubSource = (parentSource) => {
    setSelectedSource(null);
    setParentId(parentSource.id);
    setFormOpen(true);
  };

  const handleEdit = (source) => {
    setSelectedSource(source);
    setParentId(source.parent_id);
    setFormOpen(true);
  };

  const handleFormClose = (refresh) => {
    setFormOpen(false);
    setSelectedSource(null);
    setParentId(null);
    if (refresh) fetchSources();
  };

  const handleBackfillRun = async () => {
    setBackfillRunning(true);
    const result = await runAttributionBackfill({
      dryRun: backfillDryRun,
      forceReattribute: backfillForce,
    });
    setBackfillRunning(false);
    setBackfillOpen(false);
    if (result.error) {
      toast.error(`Backfill failed: ${result.error}`);
    } else {
      const mode = backfillDryRun ? "Dry run" : backfillForce ? "Force reattribute" : "New users only";
      toast.info(`${mode} backfill started in background — check server logs for progress.`, { autoClose: 6000 });
    }
    // Reset options
    setBackfillDryRun(false);
    setBackfillForce(false);
  };

  const getRulesDescription = (rules) => {
    if (!rules || rules.length === 0) return "—";
    return rules
      .map((r) => `${r.match_type}: ${r.value}`)
      .join(", ");
  };

  // Sort sources by attribution priority order (matches _match_source() in attribution_service.py)
  const sortedSources = [...sources].sort((a, b) => {
    const ai = PRIORITY_SLUGS.indexOf(a.slug);
    const bi = PRIORITY_SLUGS.indexOf(b.slug);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <Card className="page-card" sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Customer Sources
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer acquisition source taxonomy used for attribution
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ReplayIcon />}
            onClick={() => setBackfillOpen(true)}
          >
            Re-run Attribution
          </Button>
        </Box>
      </Box>

      {/* Attribution Priority Info Widget */}
      <Paper
        variant="outlined"
        sx={{ mb: 3, borderColor: "info.light", bgcolor: "rgba(2,136,209,0.04)", overflow: "hidden" }}
      >
        {/* Clickable header */}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          px={2}
          py={1.25}
          onClick={() => setPriorityOpen((v) => !v)}
          sx={{ cursor: "pointer", userSelect: "none" }}
        >
          <InfoIcon sx={{ color: "info.main", flexShrink: 0, fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight="bold" sx={{ flexGrow: 1 }}>
            Attribution Priority Order
          </Typography>
          {priorityOpen ? <ExpandLessIcon sx={{ color: "text.secondary", fontSize: 18 }} /> : <ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 18 }} />}
        </Box>

        {/* Collapsible content */}
        <Collapse in={priorityOpen}>
          <Box px={2} pb={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              When a customer places their first order, signals are evaluated in this exact order.
              The first match wins and that source is recorded permanently.
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2, "& li": { mb: 0.25 } }}>
              {PRIORITY_STEPS.map(({ step, label, slug }) => (
                <Box component="li" key={step}>
                  <Typography variant="caption">
                    {label}
                    {slug && (
                      <Box
                        component="code"
                        sx={{
                          ml: 0.75,
                          px: 0.5,
                          py: 0.1,
                          bgcolor: "action.hover",
                          borderRadius: 0.5,
                          fontSize: "0.7rem",
                          color: "error.main",
                        }}
                      >
                        {slug}
                      </Box>
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Detection Rules</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSources.map((source) => {
                const hasChildren =
                  source.sub_sources && source.sub_sources.length > 0;
                const isExpanded = expandedIds.has(source.id);

                return (
                  <>
                    {/* Parent row */}
                    <TableRow
                      key={source.id}
                      hover
                      sx={{ "& > td": { fontWeight: "bold" } }}
                    >
                      <TableCell>
                        {hasChildren && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(source.id)}
                          >
                            {isExpanded ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>{source.name}</TableCell>
                      <TableCell>
                        <code>{source.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {getRulesDescription(source.detection_rules)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={source.is_active ? "Active" : "Inactive"}
                          color={source.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(source)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add Sub-Source">
                          <IconButton
                            size="small"
                            onClick={() => handleAddSubSource(source)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Sub-source rows */}
                    {hasChildren && (
                      <TableRow key={`${source.id}-children`}>
                        <TableCell
                          colSpan={6}
                          sx={{ p: 0, borderBottom: 0 }}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Table size="small">
                              <TableBody>
                                {source.sub_sources.map((sub) => (
                                  <TableRow key={sub.id} hover>
                                    <TableCell width={40} />
                                    <TableCell sx={{ pl: 6 }}>
                                      ↳ {sub.name}
                                    </TableCell>
                                    <TableCell>
                                      <code>{sub.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {getRulesDescription(
                                          sub.detection_rules
                                        )}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        size="small"
                                        label={
                                          sub.is_active
                                            ? "Active"
                                            : "Inactive"
                                        }
                                        color={
                                          sub.is_active
                                            ? "success"
                                            : "default"
                                        }
                                      />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Edit">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEdit(sub)}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
              {sortedSources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={4}>
                      No customer sources found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {formOpen && (
        <CustomerSourceForm
          open={formOpen}
          onClose={handleFormClose}
          source={selectedSource}
          parentId={parentId}
          allSources={sources}
        />
      )}

      {/* Attribution Backfill Dialog */}
      <Dialog open={backfillOpen} onClose={() => setBackfillOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Re-run Attribution Backfill</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Runs the attribution engine against all customers with successful orders.
            The job runs in the background — check server logs for progress.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>When to use this:</strong> after updating attribution logic, adding new
            detection rules, or fixing a misconfiguration — so all existing customers are
            re-evaluated against the latest rules.
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={backfillDryRun}
                onChange={(e) => {
                  setBackfillDryRun(e.target.checked);
                  if (e.target.checked) setBackfillForce(false);
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="bold">Dry run</Typography>
                <Typography variant="caption" color="text.secondary">
                  Preview what attribution would be assigned without writing to the database.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", mb: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={backfillForce}
                disabled={backfillDryRun}
                onChange={(e) => setBackfillForce(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Force reattribute all customers
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Re-runs on customers who <em>already have</em> a source assigned.
                  Leave unchecked to only process new / unattributed customers.
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start" }}
          />

          {backfillForce && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will <strong>overwrite</strong> existing attribution records for all customers.
              Make sure your detection rules are correct before proceeding.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackfillOpen(false)} disabled={backfillRunning}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={backfillForce ? "warning" : "primary"}
            onClick={handleBackfillRun}
            disabled={backfillRunning}
            startIcon={backfillRunning ? <CircularProgress size={16} /> : <ReplayIcon />}
          >
            {backfillRunning ? "Starting..." : backfillDryRun ? "Run Dry Run" : "Run Backfill"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
