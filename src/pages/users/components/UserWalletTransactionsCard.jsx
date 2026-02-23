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
import { getUserWalletTransactions } from "../../../core/apis/adminUsersAPI";

export default function UserWalletTransactionsCard({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserWalletTransactions(userId, {
        page: page + 1,
        pageSize: rowsPerPage,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setTransactions(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch {
      toast.error("Failed to load wallet transactions");
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
            <Typography variant="h6">Wallet Transactions</Typography>
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
                <TableCell>Amount</TableCell>
                <TableCell>Transaction Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : transactions.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No wallet transactions found</Typography>
                      </TableCell>
                    </TableRow>
                  )
                : transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    const transactionTitle = tx.title || tx.source || "Transaction";
                    const sourceColor = isPositive ? "success" : "error";
                    return (
                      <TableRow key={tx.transaction_id} hover>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {tx.created_at ? dayjs(tx.created_at).format("DD/MM/YY HH:mm") : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={isPositive ? "success.main" : "error.main"}
                          >
                            {isPositive ? "+" : ""}{Number(tx.amount).toFixed(2)} EUR
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transactionTitle}
                            color={sourceColor}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
