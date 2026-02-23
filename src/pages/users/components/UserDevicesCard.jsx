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
import {
  PhoneAndroid as PhoneIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserDevices } from "../../../core/apis/adminUsersAPI";

export default function UserDevicesCard({ userId }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserDevices(userId, {
        page: page + 1,
        pageSize: rowsPerPage,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setDevices(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch {
      toast.error("Failed to load devices");
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
            <Typography variant="h6">Devices</Typography>
            {!loading && (
              <Chip label={`${totalCount} total`} size="small" variant="outlined" />
            )}
          </Box>
        }
        avatar={<PhoneIcon color="action" />}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 420, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>OS</TableCell>
                <TableCell>App Version</TableCell>
                <TableCell>IP Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Login</TableCell>
                <TableCell>Logout</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : devices.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No devices found</Typography>
                      </TableCell>
                    </TableRow>
                  )
                : devices.map((device) => (
                    <TableRow key={device.device_table_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {device.device_model || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {device.manufacturer || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {device.os || "—"} {device.os_version || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {device.app_version || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {device.ip_location || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={device.is_logged_in ? "Logged In" : "Logged Out"}
                          color={device.is_logged_in ? "success" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {device.timestamp_login
                            ? dayjs(device.timestamp_login).format("DD/MM/YY HH:mm")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {device.timestamp_logout
                            ? dayjs(device.timestamp_logout).format("DD/MM/YY HH:mm")
                            : "—"}
                        </Typography>
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
