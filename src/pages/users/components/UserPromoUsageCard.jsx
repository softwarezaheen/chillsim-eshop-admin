import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserPromoUsage } from "../../../core/apis/adminUsersAPI";

const statusColorMap = {
  completed: "success",
  pending: "warning",
  failed: "error",
  expired: "default",
  reversed: "error",
  withdrawn: "error",
};

export default function UserPromoUsageCard({ userId }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserPromoUsage(userId, {
        page: page + 1,
        pageSize: rowsPerPage,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        // RPC now filters to only promotion/referral records, no client-side filter needed
        setPromos(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch {
      toast.error("Failed to load promotion usage");
    } finally {
      setLoading(false);
    }
  }, [userId, page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h6">Promotion Usage</Typography>
            {!loading && (
              <Chip label={`${totalCount} total`} size="small" variant="outlined" />
            )}
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Promo Code</TableCell>
                <TableCell>Referral Code</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : promos.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No promotion usage found</Typography>
                      </TableCell>
                    </TableRow>
                  )
                : promos.map((promo) => (
                    <TableRow key={promo.usage_id} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {promo.created_at ? dayjs(promo.created_at).format("DD/MM/YY HH:mm") : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {promo.promotion_code || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {promo.referral_code || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={promo.amount > 0 ? "success.main" : "text.primary"}
                        >
                          {promo.amount != null ? `${Number(promo.amount).toFixed(2)} EUR` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={promo.status}
                          color={statusColorMap[promo.status] || "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalCount > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </CardContent>
    </Card>
  );
}
