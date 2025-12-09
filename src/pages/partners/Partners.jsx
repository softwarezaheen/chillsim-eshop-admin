import { useEffect, useState, useCallback } from "react";
import { Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, TablePagination } from "@mui/material";
import Filters from "../../Components/Filters/Filters";
import supabase from "../../core/apis/supabase";
import PartnerForm from "./PartnerForm";
import { Button } from "@mui/material";

export default function Partners() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("partners")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (search.trim()) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error, count } = await query;
    if (!error) {
      setPartners(data || []);
      setTotalRows(count || 0);
    }
    setLoading(false);
  }, [search, page, pageSize]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAdd = () => {
    setSelectedPartner(null);
    setFormOpen(true);
  };

  const handleEdit = (partner) => {
    setSelectedPartner(partner);
    setFormOpen(true);
  };

  const handleFormClose = (refresh) => {
    setFormOpen(false);
    setSelectedPartner(null);
    if (refresh) fetchPartners();
  };

  return (
    <Card className="page-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Partners
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleAdd}
          id=":add-partner:"
        >
          Add Partner
        </Button>
      </div>
      <Filters
        onReset={() => {
          setSearch("");
          setPage(0);
        }}
        onApply={() => {
          setPage(0);
        }}
        applyDisable={!search || search === ""}
      >
        <div style={{ width: "100%" }}>
          <label className="mb-2" htmlFor="partner-search-input" style={{ display: "block", fontWeight: 500 }}>
            Search
          </label>
          <input
            id="partner-search-input"
            type="text"
            placeholder="Search by Partner Name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "1rem",
              boxSizing: "border-box",
              marginBottom: "4px"
            }}
          />
        </div>
      </Filters>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Prefix</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : partners.map(partner => (
              <TableRow key={partner.id} onClick={() => handleEdit(partner)} style={{ cursor: "pointer" }}>
                <TableCell>{partner.id}</TableCell>
                <TableCell>{partner.name}</TableCell>
                <TableCell>{partner.code_prefix}</TableCell>
                <TableCell>{partner.description}</TableCell>
                <TableCell>{partner.contact_info?.contactPerson || ""}</TableCell>
                <TableCell>{partner.contact_info?.email || ""}</TableCell>
                <TableCell>{partner.contact_info?.phone || ""}</TableCell>
                <TableCell>{partner.created_at ? new Date(partner.created_at).toLocaleString() : ""}</TableCell>
                <TableCell>{partner.updated_at ? new Date(partner.updated_at).toLocaleString() : ""}</TableCell>
                <TableCell>{partner.is_active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
      {formOpen && (
        <PartnerForm
          open={formOpen}
          onClose={handleFormClose}
          partner={selectedPartner}
        />
      )}
    </Card>
  );
}
