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
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getUserEsimProfiles } from "../../../core/apis/adminUsersAPI";

const statusColorMap = {
  active: "success",
  delivered: "info",
  expired: "error",
};

const formatDataAmount = (mb) => {
  if (!mb || mb === 0) return "0 MB";
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${Number(mb).toFixed(0)} MB`;
};

export default function UserEsimProfilesCard({ userId, onProfileClick }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter states
  const [iccidSearch, setIccidSearch] = useState("");
  const [hideExpired, setHideExpired] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserEsimProfiles(userId, {
        iccidSearch: iccidSearch || undefined,
        hideExpired: hideExpired,
        page: page + 1,
        pageSize: pageSize,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setProfiles(result.data || []);
        setTotalCount(result.count || 0);
        setStatistics(result.statistics || {});
      }
    } catch (e) {
      toast.error("Failed to load eSIM profiles");
    } finally {
      setLoading(false);
    }
  }, [userId, iccidSearch, hideExpired, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalDataSold = statistics.total_data_allocated_mb || 0;
  const totalDataConsumed = statistics.total_data_used_mb || 0;
  const unlimitedCount = statistics.unlimited_bundles_count || 0;
  const activeCount = statistics.active_profiles || 0;
  const totalProfiles = (statistics.active_profiles || 0) + (statistics.pending_profiles || 0) + (statistics.expired_profiles || 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6">eSIM Profiles</Typography>
            {!loading && (
              <>
                <Chip
                  label={`${activeCount} / ${totalProfiles} active`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.3 }}>
                      <Typography variant="caption" component="span">
                        {`${formatDataAmount(totalDataConsumed)} / ${formatDataAmount(totalDataSold)}`}
                      </Typography>
                      {unlimitedCount > 0 && (
                        <Typography variant="caption" component="span" sx={{ fontSize: "0.65rem" }}>
                          {`+${unlimitedCount} unlimited`}
                        </Typography>
                      )}
                    </Box>
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: "auto", py: 0.75 }}
                />
              </>
            )}
          </Box>
        }
        action={
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideExpired}
                  onChange={(e) => {
                    setHideExpired(e.target.checked);
                    setPage(0);
                  }}
                  size="small"
                />
              }
              label={<Typography variant="caption">Hide Expired</Typography>}
              sx={{ m: 0, whiteSpace: "nowrap" }}
            />
            <TextField
              placeholder="Search ICCID..."
              size="small"
              value={iccidSearch}
              onChange={(e) => {
                setIccidSearch(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 180 }}
            />
          </Box>
        }
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer sx={{ maxHeight: 480, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ICCID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : profiles.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No eSIM profiles found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                : profiles.map((profile) => (
                    <TableRow
                      key={profile.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => onProfileClick && onProfileClick(profile)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="primary.main"
                          sx={{ fontFamily: "monospace", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          {profile.iccid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={profile.profile_status}
                          color={statusColorMap[profile.profile_status] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {profile.profile_expiry_date
                            ? dayjs(profile.profile_expiry_date).format("DD/MM/YY")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {profile.created_at
                            ? dayjs(profile.created_at).format("DD/MM/YY")
                            : "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </CardContent>
    </Card>
  );
}
