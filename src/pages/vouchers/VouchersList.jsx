import { useEffect, useState } from "react";
import { TextField, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import supabase from "../../core/apis/supabase";
import GenerateVouchers from "./GenerateVouchers";
import { Button } from "@mui/material";
import Filters from "../../Components/Filters/Filters";
import { getPartners } from "../../core/apis/partnersAPI";
import { MenuItem, Select, InputLabel } from "@mui/material";
import CustomDatePicker from "../../Components/CustomDatePicker";
import { TablePagination } from "@mui/material";
import { bulkExpireVouchers, bulkDeleteVouchers, bulkExportVouchers } from "../../core/apis/vouchersAPI";

export default function VouchersList() {
  function formatCode(code) {
    if (!code) return "";
    return code.match(/.{1,4}/g)?.join("-") || code;
  }
  const [genOpen, setGenOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [partner, setPartner] = useState("");
  const [partnersList, setPartnersList] = useState([]);
  const [used, setUsed] = useState("");
  const [active, setActive] = useState("");
  const [exported, setExported] = useState("");
  const [createdStart, setCreatedStart] = useState(null);
  const [createdEnd, setCreatedEnd] = useState(null);
  const [updatedStart, setUpdatedStart] = useState(null);
  const [updatedEnd, setUpdatedEnd] = useState(null);
  const [usedBy, setUsedBy] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selected, setSelected] = useState([]);
  const [bulkDialog, setBulkDialog] = useState({ open: false, action: null });
  const [exportLoading, setExportLoading] = useState(false);
  const [exportedStart, setExportedStart] = useState(null);
  const [exportedEnd, setExportedEnd] = useState(null);
  const isAllSelected = selected.length > 0 && totalRows > 0 && selected.length === totalRows;
  const handleSelectAll = async (e) => {
    if (e.target.checked) {
      // Fetch all filtered voucher IDs (ignore pagination)
      let query = supabase
        .from("voucher")
        .select("id", { count: "exact" });
      if (search.trim()) {
        const cleanedSearch = search.replace(/[-\s]/g, "");
        query = query.ilike("code", `%${cleanedSearch}%`);
      }
      if (partner) {
        if (partner === "NONE") {
          query = query.is("partner_id", null);
        } else {
          query = query.eq("partner_id", partner);
        }
      }
      if (used) {
        query = query.eq("is_used", used === "yes");
      }
      if (active) {
        query = query.eq("is_active", active === "yes");
      }
      if (exported) {
        query = query.eq("exported", exported === "yes");
      }
      if (createdStart) {
        query = query.gte("created_at", createdStart.toISOString());
      }
      if (createdEnd) {
        query = query.lte("created_at", createdEnd.toISOString());
      }
      if (updatedStart) {
        query = query.gte("updated_at", updatedStart.toISOString());
      }
      if (updatedEnd) {
        query = query.lte("updated_at", updatedEnd.toISOString());
      }
      if (exportedStart) {
        query = query.gte("exported_at", exportedStart.toISOString());
      }
      if (exportedEnd) {
        query = query.lte("exported_at", exportedEnd.toISOString());
      }
      const { data, error } = await query;
      if (!error && data) {
        setSelected(data.map(v => v.id));
      }
    } else {
      setSelected([]);
    }
  };
  const handleSelectOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };
  const handleBulkAction = async (action) => {
    setBulkDialog({ open: false, action: null });
    if (selected.length === 0) return;
    if (action === "expire") {
      await bulkExpireVouchers(selected);
      fetchVouchers();
      setSelected([]);
    } else if (action === "delete") {
      await bulkDeleteVouchers(selected);
      fetchVouchers();
      setSelected([]);
    } else if (action === "export") {
      setExportLoading(true);
      // Prepare CSV data
      const now = new Date().toLocaleString();
      function formatCode(code) {
        if (!code) return "";
        return code.match(/.{1,4}/g)?.join("-") || code;
      }
      const exportData = vouchers.filter(v => selected.includes(v.id)).map(v => {
        // Build row without id, used_by, partner_id
        const {
          id,
          used_by,
          partner_id,
          partners,
          exported,
          exported_at,
          code,
          ...rest
        } = v;
        return {
          code,
          code_display: formatCode(code),
          ...rest,
          Partner: partners?.name || "",
          Exported: "Yes",
          Exported_At: exported ? (exported_at ? new Date(exported_at).toLocaleString() : now) : now
        };
      });
      if (exportData.length > 0) {
        // Ensure code_display is right after code
        let columns = Object.keys(exportData[0]);
        // Move code_display after code
        if (columns.includes("code") && columns.includes("code_display")) {
          columns = [
            ...columns.filter(c => c === "code"),
            ...columns.filter(c => c === "code_display"),
            ...columns.filter(c => c !== "code" && c !== "code_display")
          ];
        }
        const csvRows = [columns.join(",")].concat(
          exportData.map(row => columns.map(col => `"${row[col] ?? ""}"`).join(","))
        );
        const csvContent = csvRows.join("\n");
        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vouchers_export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      // Update exported status in DB
      await bulkExportVouchers(selected);
      fetchVouchers();
      setSelected([]);
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [search, partner, used, active, exported, createdStart, createdEnd, updatedStart, updatedEnd, exportedStart, exportedEnd, usedBy, page, pageSize]);

  // Clear selection when filters change
  useEffect(() => {
    setSelected([]);
  }, [search, partner, used, active, exported, createdStart, createdEnd, updatedStart, updatedEnd, usedBy]);

  useEffect(() => {
    async function loadPartners() {
      const { data } = await getPartners();
      setPartnersList(data || []);
    }
    loadPartners();
  }, []);

  const fetchVouchers = async () => {
  setLoading(true);
    let query = supabase
      .from("voucher")
      .select("*, partners(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (search.trim()) {
      const cleanedSearch = search.replace(/[-\s]/g, "");
      query = query.ilike("code", `%${cleanedSearch}%`);
    }
    if (partner) {
      if (partner === "NONE") {
        query = query.is("partner_id", null);
      } else {
        query = query.eq("partner_id", partner);
      }
    }
    if (used) {
      query = query.eq("is_used", used === "yes");
    }
    if (active) {
      query = query.eq("is_active", active === "yes");
    }
    if (exported) {
      query = query.eq("exported", exported === "yes");
    }
    if (createdStart) {
      query = query.gte("created_at", createdStart.toISOString());
    }
    if (createdEnd) {
      query = query.lte("created_at", createdEnd.toISOString());
    }
    if (updatedStart) {
      query = query.gte("updated_at", updatedStart.toISOString());
    }
    if (updatedEnd) {
      query = query.lte("updated_at", updatedEnd.toISOString());
    }
    if (exportedStart) {
      query = query.gte("exported_at", exportedStart.toISOString());
    }
    if (exportedEnd) {
      query = query.lte("exported_at", exportedEnd.toISOString());
    }
    const { data, error, count } = await query;
    let vouchersData = data || [];
    // JS-side merge for user emails
    if (vouchersData.length > 0) {
      const usedByIds = [...new Set(vouchersData.map(v => v.used_by).filter(Boolean))];
      if (usedByIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users_copy")
          .select("id, email")
          .in("id", usedByIds);
        if (!usersError && usersData) {
          const userMap = Object.fromEntries(usersData.map(u => [u.id, u.email]));
          vouchersData = vouchersData.map(v => ({ ...v, user_email: userMap[v.used_by] || null }));
        }
      }
    }
    // JS-side filter for Used By
    if (usedBy.trim()) {
      const filterVal = usedBy.trim().toLowerCase();
      vouchersData = vouchersData.filter(v => {
        // Check both user_email and used_by columns
        const email = (v.user_email || "").toLowerCase();
        const id = (v.used_by || "").toLowerCase();
        return email.includes(filterVal) || id.includes(filterVal);
      });
    }
    if (!error) {
      setVouchers(vouchersData);
      setTotalRows(count || 0);
    }
    setLoading(false);
  };

  return (
    <Card className="page-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div />
        <Button variant="contained" color="primary" onClick={() => setGenOpen(true)}>
          Generate Vouchers
        </Button>
      </div>
      <Filters
        onReset={() => {
          setSearch("");
          setPartner("");
          setUsed("");
          setActive("");
          setExported("");
          setCreatedStart(null);
          setCreatedEnd(null);
          setUpdatedStart(null);
          setUpdatedEnd(null);
          setExportedStart(null);
          setExportedEnd(null);
          setUsedBy("");
          setPage(0);
          fetchVouchers();
        }}
        onApply={() => {
          setPage(0);
        }}
        applyDisable={false}
      >
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%', alignItems: 'flex-end', marginBottom: 12 }}>
            <TextField
              label="Voucher Code"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="medium"
              placeholder="Search by code"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              style={{ minWidth: 180, height: 48 }}
            />
            <TextField
              label="Used By (Email or User ID)"
              value={usedBy}
              onChange={e => setUsedBy(e.target.value)}
              size="medium"
              placeholder="Search by email or user ID"
              InputProps={{ startAdornment: <span style={{ marginRight: 8 }}>🔍</span> }}
              style={{ minWidth: 180, height: 48 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
              <InputLabel>Partner</InputLabel>
              <Select value={partner} onChange={e => setPartner(e.target.value)} displayEmpty size="medium" style={{ height: 48 }}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="NONE">None</MenuItem>
                {partnersList.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
              <InputLabel>Used</InputLabel>
              <Select value={used} onChange={e => setUsed(e.target.value)} displayEmpty size="medium" style={{ height: 48 }}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
              <InputLabel>Active</InputLabel>
              <Select value={active} onChange={e => setActive(e.target.value)} displayEmpty size="medium" style={{ height: 48 }}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
              <InputLabel>Exported</InputLabel>
              <Select value={exported} onChange={e => setExported(e.target.value)} displayEmpty size="medium" style={{ height: 48 }}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f7f7fa', borderRadius: 8, padding: 12, minWidth: 220 }}>
              <InputLabel style={{ marginBottom: 4 }}>Created Date Range</InputLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                <CustomDatePicker value={createdStart} onChange={setCreatedStart} label="Start" size="medium" style={{ width: 100 }} />
                <CustomDatePicker value={createdEnd} onChange={setCreatedEnd} label="End" size="medium" style={{ width: 100 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f7f7fa', borderRadius: 8, padding: 12, minWidth: 220 }}>
              <InputLabel style={{ marginBottom: 4 }}>Updated Date Range</InputLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                <CustomDatePicker value={updatedStart} onChange={setUpdatedStart} label="Start" size="medium" style={{ width: 100 }} />
                <CustomDatePicker value={updatedEnd} onChange={setUpdatedEnd} label="End" size="medium" style={{ width: 100 }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f7f7fa', borderRadius: 8, padding: 12, minWidth: 220 }}>
              <InputLabel style={{ marginBottom: 4 }}>Exported Date Range</InputLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                <CustomDatePicker value={exportedStart} onChange={setExportedStart} label="Start" size="medium" style={{ width: 100 }} />
                <CustomDatePicker value={exportedEnd} onChange={setExportedEnd} label="End" size="medium" style={{ width: 100 }} />
              </div>
            </div>
          </div>
        </div>
      </Filters>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <Button variant="outlined" color="secondary" disabled={selected.length === 0} onClick={() => setBulkDialog({ open: true, action: 'expire' })}>Expire Selected</Button>
              <Button variant="outlined" color="error" disabled={selected.length === 0} onClick={() => setBulkDialog({ open: true, action: 'delete' })}>Delete Selected</Button>
              <Button variant="outlined" color="primary" disabled={selected.length === 0 || exportLoading} onClick={() => setBulkDialog({ open: true, action: 'export' })}>Export Selected</Button>
              <span style={{ marginLeft: 8, fontSize: 13, color: '#888' }}>{selected.length > 0 ? `${selected.length} selected` : ''}</span>
            </div>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
                    </TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Used</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Partner</TableCell>
                    <TableCell>Used By</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Exported</TableCell>
                    <TableCell>Exported At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : vouchers.map(voucher => (
                    <TableRow key={voucher.id}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.includes(voucher.id)} onChange={() => handleSelectOne(voucher.id)} />
                      </TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 180, maxWidth: 400 }}>{formatCode(voucher.code)}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{voucher.amount}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{voucher.is_used ? "Yes" : "No"}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{voucher.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{voucher.partners?.name || ""}</TableCell>
                      <TableCell>
                        {voucher.user_email
                          ? <span>{voucher.user_email}</span>
                          : <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120, display: 'inline-block' }}>{voucher.used_by || ""}</span>
                        }
                      </TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{voucher.created_at ? new Date(voucher.created_at).toLocaleString() : ""}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{voucher.updated_at ? new Date(voucher.updated_at).toLocaleString() : ""}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{voucher.expired_at ? new Date(voucher.expired_at).toLocaleString() : ""}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>{voucher.exported ? "Yes" : "No"}</TableCell>
                      <TableCell style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{voucher.exported_at ? new Date(voucher.exported_at).toLocaleString() : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={bulkDialog.open} onClose={() => setBulkDialog({ open: false, action: null })}>
              <DialogTitle>
                {bulkDialog.action === 'expire' ? 'Expire Vouchers' : bulkDialog.action === 'delete' ? 'Delete Vouchers' : 'Export Vouchers'}
              </DialogTitle>
              <DialogContent>
                {bulkDialog.action === 'expire' ? (
                  <Typography>Are you sure you want to expire {selected.length} selected voucher(s)? This will set their <b>expired_at</b> and <b>updated_at</b> columns to the current date and time.</Typography>
                ) : bulkDialog.action === 'delete' ? (
                  <>
                    <Typography gutterBottom>Are you sure you want to delete {selected.length} selected voucher(s)?</Typography>
                    <Typography color="error" variant="body2" gutterBottom>
                      <b>Delete Conditions:</b>
                      <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                        <li>Voucher must NOT be used (<b>is_used = false</b>)</li>
                        <li>Voucher must NOT be exported (<b>exported = false</b>)</li>
                      </ul>
                      Only vouchers meeting these conditions will be deleted. Others will remain unchanged.
                    </Typography>
                  </>
                ) : (
                  <Typography>Are you sure you want to export {selected.length} selected voucher(s)? This will generate a CSV file (excluding ID and Used By columns) and mark exported vouchers as exported.</Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setBulkDialog({ open: false, action: null })}>Cancel</Button>
                <Button color={bulkDialog.action === 'expire' ? 'secondary' : bulkDialog.action === 'delete' ? 'error' : 'primary'} onClick={() => handleBulkAction(bulkDialog.action)} disabled={exportLoading}>
                  {bulkDialog.action === 'expire' ? 'Confirm Expire' : bulkDialog.action === 'delete' ? 'Confirm Delete' : 'Confirm Export'}
                </Button>
              </DialogActions>
            </Dialog>
      <TablePagination
        component="div"
        count={totalRows || 0}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
      {genOpen && (
        <GenerateVouchers
          open={genOpen}
          onClose={() => setGenOpen(false)}
          onGenerated={fetchVouchers}
        />
      )}
    </Card>
  );
}
