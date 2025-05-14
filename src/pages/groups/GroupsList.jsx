import React, { useEffect, useState } from "react";
import {
  deleteGroup,
  getAllGroups,
  toggleGroupStatus,
} from "../../core/apis/groupsAPI";
import { toast } from "react-toastify";
import SearchIcon from "@mui/icons-material/Search";
import TableComponent from "../../Components/shared/table-component/TableComponent";
import RowComponent from "../../Components/shared/table-component/RowComponent";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
  Button,
  Card,
  FormControl,
  FormControlLabel,
  Grid2,
  IconButton,
  List,
  ListItem,
  Switch,
  TableCell,
  TablePagination,
  TextField,
  Tooltip,
} from "@mui/material";
import Filters from "../../Components/Filters/Filters";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import MuiModal from "../../Components/Modals/MuiModal";
import { displayTypes, groupTypes } from "../../core/vairables/EnumData";
import GroupDeleteNotice from "../../Components/page-component/groups/GroupDeleteNotice";

const GroupsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState({ open: false, data: null });
  const [openNotice, setOpenNotice] = useState({ open: false, data: null });
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const [searchQueries, setSearchQueries] = useState({
    name: "",
    pageSize: 10,
    page: 0,
  });

  const getGroups = async () => {
    setLoading(true);

    try {
      const { name, page, pageSize } = searchQueries;
      console.log("hereeee", name, page, pageSize);
      const { data, error, count } = await getAllGroups(page, pageSize, name);
      console.log(count, "www");
      if (error) {
        toast.error(error?.message);
        setLoading(false);
        setData([]);
        setTotalRows(0);
      } else {
        setTotalRows(count);
        setData(
          data?.map((el) => ({
            ...el,
            ...el?.metadata,
          }))
        );
        setLoading(false);
      }
    } catch (e) {
      toast.error(e?.message || "Fail to display data");
      setLoading(false);
    }
  };

  useEffect(() => {
    getGroups();
  }, [searchQueries]);

  const resetFilters = () => {
    setSearchQueries({ ...searchQueries, name: "" });
    setSearch("");
  };

  const applyFilter = () => {
    setSearchQueries({ ...searchQueries, name: search });
  };

  const tableHeaders = [
    { name: "Name" },
    { name: "Type" },
    { name: "Category" },
    { name: "Is Active" },
    { name: "Created At" },
  ];

  const handleDeleteGroup = () => {
    deleteGroup(openDelete?.data?.id).then((res) => {
      console.log(res, "ress of deleting a group");
      if (res?.error) {
        if (res?.data?.code === "linked-bundles") {
          setOpenDelete({ open: false, data: null });
          setOpenNotice({ data: res?.data?.bundle_count, open: true });
        }
        toast.error(res?.error);
      } else {
        getGroups();
        setOpenDelete({ open: false, data: null });
      }
    });
  };

  console.log(data, "ddddddddddddddd");

  const handleGroupStatus = (group) => {
    toggleGroupStatus({ id: group?.id, currentValue: group?.is_active }).then(
      (res) => {
        if (!res?.error) {
          getGroups();
        }
      }
    );
    console.log(group);
  };

  return (
    <>
      <Card className="page-card">
        <Filters
          onReset={resetFilters}
          onApply={applyFilter}
          applyDisable={!search || search === ""}
        >
          <Grid2 container size={{ xs: 12 }} spacing={2}>
            <Grid2 item size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <label className="mb-2">Search</label>
                <TextField
                  fullWidth
                  required
                  size="small"
                  placeholder="Search By Name"
                  type="text"
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                    },
                  }}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </FormControl>
            </Grid2>
          </Grid2>
        </Filters>

        <TableComponent
          loading={loading}
          dataPerPage={searchQueries?.pageSize}
          tableData={data}
          noDataFound={"No Groups Found"}
          tableHeaders={tableHeaders}
          actions={true}
          onAdd={() => navigate("/groups/add")}
        >
          {data?.map((el) => (
            <RowComponent
              key={el?.id}
              actions={true}
              onEdit={() => navigate(`/groups/${el?.id}`)}
              onDelete={() => setOpenDelete({ open: true, data: el })}
            >
              <TableCell
                sx={{ minWidth: "200px" }}
                className={"max-w-[250px] truncate"}
              >
                {el?.name}
              </TableCell>
              <TableCell>
                {displayTypes?.find((s) => s?.id === el?.type)?.title || "N/A"}
              </TableCell>
              <TableCell>
                {groupTypes.find((s) => s?.id === el?.group_category)?.title ||
                  "N/A"}
              </TableCell>
              <TableCell
                sx={{ minWidth: "150px" }}
                className={"max-w-[200px] truncate"}
              >
                <Switch
                  color="success"
                  checked={el?.is_active}
                  onChange={() => handleGroupStatus(el)}
                  name="is_active"
                />
              </TableCell>
              <TableCell
                sx={{ minWidth: "200px" }}
                className={"max-w-[250px] truncate"}
              >
                {dayjs(el?.created_at).format("DD-MM-YYYY HH:mm")}
              </TableCell>
            </RowComponent>
          ))}
        </TableComponent>
        <TablePagination
          component="div"
          count={totalRows || 0}
          page={searchQueries?.page}
          onPageChange={(e, newPage) => {
            console.log(newPage, "dddddddddddd");
            setSearchQueries({ ...searchQueries, page: newPage });
          }}
          rowsPerPage={searchQueries?.pageSize}
          onRowsPerPageChange={(e) => {
            setSearchQueries({ ...searchQueries, pageSize: e.target.value });
          }}
        />
        {openDelete?.open && (
          <MuiModal
            open={true}
            onClose={() => setOpenDelete({ open: false, data: null })}
            title={"Notice!"}
            onConfirm={() => handleDeleteGroup()}
          >
            <p className={"text-center"}>
              Are you sure you want to delete{" "}
              <span className={"font-bold"}>
                {openDelete?.data?.name
                  ? `${openDelete?.data?.name}'s`
                  : "this"}{" "}
              </span>{" "}
              group?
            </p>
          </MuiModal>
        )}
      </Card>
      {openNotice?.open && (
        <GroupDeleteNotice
          onClose={() => setOpenNotice({ open: false, data: null })}
          data={openNotice?.data || null}
        />
      )}
    </>
  );
};

export default GroupsList;
