import {
  Box,
  Card,
  Checkbox,
  IconButton,
  ListItemText,
  MenuItem,
  Radio,
  Select,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useRef, useState } from "react";
// import MuiCheckbox from "../MuiCheckbox";
import EmptyComponent from "./EmptyComponent";
// import "./MuiTable.scss";
import Grid from "@mui/material/Grid2";
import { useTheme } from "@mui/styles";
const CustomHeader = (props) => {
  return <div>{props.column.field}</div>;
};
// const MuiTable = ({
//   columns,
//   data,
//   loading,
//   paginationModel,
//   setPaginationModel,
//   totalRows,
//   style,
//   pageSizeOptions = [5, 10, 20, 100],
//   rowId = "index",
//   rowSelectionModel = null,
//   setRowSelectionModel = null,
//   density = "compact",
//   paginationMode = "server",
//   hideFooterPagination = false,
// }) => {
//   //remove sorting from all columns
//   // columns = columns.map((item)=>{ return {...item,sortable:false}})

//   return (
//     <Box id="MuiTable" className="no_design_scroll">
//       <DataGrid
//         autoHeight
//         hideFooterPagination={hideFooterPagination}
//         slots={{ noRowsOverlay: EmptyComponent, BaseCheckbox: MuiCheckbox }}
//         className={`customized datagrid ${data?.length == 0 ? "empty" : ""} `}
//         getRowId={(row) => row[rowId]}
//         disableRowSelectionOnClick
//         rowCount={totalRows} // Make sure this value is correct
//         columns={
//           rowSelectionModel && typeof setRowSelectionModel == "function"
//             ? [
//                 {
//                   field: "select",
//                   width: 75,
//                   headerClassName: "remove-Icons",
//                   headerName: (
//                     <MuiCheckbox
//                       checkedIcon={
//                         rowSelectionModel?.length == data?.length ? (
//                           <CircleCheckedFilled />
//                         ) : (
//                           <RemoveCircleIcon />
//                         )
//                       }
//                       checked={rowSelectionModel?.length > 0}
//                       onClick={() => {
//                         if (rowSelectionModel.length > 0)
//                           setRowSelectionModel([]);
//                         else {
//                           setRowSelectionModel(
//                             data?.map((row, index) =>
//                               rowId === "index" ? String(index) : row[rowId]
//                             )
//                           );
//                         }
//                       }}
//                     />
//                   ),
//                   renderCell: (params) => (
//                     <MuiCheckbox
//                       onClick={() => {
//                         setRowSelectionModel((prev) => {
//                           // Check if the recordGuid is already in the selection model
//                           if (rowSelectionModel?.includes(params?.row[rowId])) {
//                             // If it's in the model, remove it (deselect)
//                             return prev.filter(
//                               (item) => item != params?.row[rowId]
//                             );
//                           } else {
//                             // If it's not in the model, add it (select)
//                             return [...prev, params?.row[rowId]];
//                           }
//                         });
//                       }}
//                       checked={rowSelectionModel?.includes(params?.row[rowId])}
//                     />
//                   ),
//                 },
//                 ...columns,
//               ]
//             : columns
//         }
//         rows={data?.map((item, index) => {
//           return { ...item, index: String(index) };
//         })}
//         density={density}
//         sx={{ "DataGrid-overlayHeight": "600px", ...style }}
//         pageSizeOptions={pageSizeOptions}
//         paginationModel={paginationModel}
//         onPaginationModelChange={setPaginationModel}
//         paginationMode={paginationMode}
//         loading={loading}
//         disableColumnFilter
//         getRowClassName={(params) =>
//           params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
//         }
//         sortingOrder={["asc", "desc", null]}
//         disableColumnMenu={true}
//       />
//     </Box>
//   );
// };

const MuiTable = ({
  columns,
  data,
  loading,
  paginationModel,
  setPaginationModel,
  totalRows,
  style,
  pageSizeOptions = [5, 10, 20, 100],
  rowId = "index",
  rowSelectionModel = null,
  setRowSelectionModel = null,
  density = "compact",
  paginationMode = "server",
  hideFooterPagination = false,
  showManageColumns = false,
  GridLinesVisibility = "None",
}) => {
  // Initialize hiddenColumns based on the columns' hideable and hidden properties
  const theme = useTheme();
  const initialHiddenColumns = columns
    .filter((col) => col.hideable && col.hidden)
    .map((col) => col.field);

  const [hiddenColumns, setHiddenColumns] = useState(initialHiddenColumns);
  const visibleColumns = columns
    .filter((col) => !hiddenColumns.includes(col.field))
    .map((item) => {
      return {
        ...item,
        sortable: false,
        align: "left",
        flex: undefined,
        width: item?.width ?? 250,
      };
    });
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const handleDropdownOpen = () => {
    setOpen(true);

    setTimeout(() => {
      if (dropdownRef?.current) {
        dropdownRef.current.scrollTop = 0;
      }
    }, 0);
  };

  // Function to toggle visibility of hideable columns
  const toggleColumnVisibility = (field) => {
    setHiddenColumns((prev) =>
      prev.includes(field)
        ? prev.filter((col) => col !== field)
        : [...prev, field]
    );
  };

  return (
    <Grid
      sx={{
        borderRadius: "18px",
        ...(data?.length === 0 && { minHeight: "200px" }),
      }}
    >
      {/* Dropdown with checkboxes to toggle column visibility */}
      {showManageColumns && (
        <Box
          display="flex"
          alignItems="center"
          p={1}
          sx={{ cursor: "pointer" }}
        >
          <IconButton
            size="small"
            id="showOption"
            onClick={() => setOpen((prev) => !prev)}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Typography variant="subtitle2" className="secondary grey">
              Show/Hide Columns
            </Typography>
          </IconButton>

          <Select
            ref={dropdownRef}
            multiple
            open={open}
            onOpen={handleDropdownOpen}
            onClose={() => setOpen(false)}
            value={columns
              .filter(
                (col) => col.hideable && !hiddenColumns.includes(col.field)
              )
              .map((col) => col.field)}
            displayEmpty
            renderValue={() => null}
            MenuProps={{
              PaperProps: { sx: { maxHeight: 250 } },
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              transformOrigin: { vertical: "top", horizontal: "right" },
            }}
            sx={{ mr: 2, cursor: "pointer" }}
          >
            <MenuItem>
              <Checkbox
                checked={hiddenColumns.length === 0}
                indeterminate={
                  hiddenColumns.length > 0 &&
                  hiddenColumns.length <
                    columns.filter((col) => col.hideable).length
                }
                onChange={() => {
                  if (hiddenColumns.length === 0) {
                    setHiddenColumns(
                      columns
                        .filter((col) => col.hideable)
                        .map((col) => col.field)
                    ); // Hide all
                  } else {
                    setHiddenColumns([]);
                  }
                }}
              />
              <ListItemText
                primary="Select All"
                onClick={() => {
                  if (hiddenColumns.length === 0) {
                    setHiddenColumns(
                      columns
                        .filter((col) => col.hideable)
                        .map((col) => col.field)
                    ); // Hide all
                  } else {
                    setHiddenColumns([]);
                  }
                }}
              />
            </MenuItem>

            {/* Individual Column Options */}
            {columns
              .filter((col) => col.hideable) // Only show hideable columns in the toggle UI
              .map((col) => (
                <MenuItem key={col.field} value={col.field}>
                  <Checkbox
                    checked={!hiddenColumns.includes(col.field)}
                    onChange={() => toggleColumnVisibility(col.field)}
                  />
                  <ListItemText
                    primary={col.headerName}
                    onClick={() => toggleColumnVisibility(col.field)}
                  />
                </MenuItem>
              ))}
          </Select>
        </Box>
      )}

      <DataGrid
        autoHeight
        density="standard"
        GridLinesVisibility="none"
        GridLines="None"
        hideFooterPagination={hideFooterPagination}
        slots={{ noRowsOverlay: EmptyComponent }}
        className={`customized datagrid ${data?.length === 0 ? "empty" : ""}`}
        getRowId={(row) => row[rowId]}
        disableRowSelectionOnClick
        rowCount={totalRows}
        columns={
          rowSelectionModel && typeof setRowSelectionModel === "function"
            ? [
                {
                  field: "select",
                  width: 100,
                  headerClassName: "remove-Icons",
                  renderCell: (params) => (
                    <Radio
                      onClick={() => {
                        setRowSelectionModel((prev) => {
                          if (rowSelectionModel?.includes(params?.row[rowId])) {
                            return prev.filter(
                              (item) => item !== params?.row[rowId]
                            );
                          } else {
                            return [...prev, params?.row[rowId]];
                          }
                        });
                      }}
                      checked={rowSelectionModel?.includes(params?.row[rowId])}
                    />
                  ),
                },
                ...visibleColumns,
              ]
            : visibleColumns
        }
        rows={data?.map((item, index) => ({ ...item, index: String(index) }))}
        pageSizeOptions={pageSizeOptions}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        paginationMode={paginationMode}
        loading={loading}
        disableColumnFilter
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        sortingOrder={["asc", "desc", null]}
        disableColumnMenu
        sx={{
          padding: 1,
          minHeight: "50vh",
          "& .MuiDataGrid-virtualScroller": {
            overflowY: "auto !important", // Ensures scrolling works
          },

          // : {
          //   backgroundColor: "#f9f9f9", // Light gray background
          // },
          //  {
          //   backgroundColor: "white",
          // },
          "& .even": {
            backgroundColor: theme.palette.background.paper,
            "&:hover": {
              backgroundColor: "none !important",
            },
          },
          "& .odd": {
            backgroundColor: theme.palette.background.default,
            "&:hover": {
              backgroundColor: "none !important",
            },
          },
          "&, [class^=MuiDataGrid]": { border: "none" },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within":
            {
              outline: "none !important",
            },
          "& .MuiDataGrid-footerContainer": {
            display: "flex",
            alignItems: "center",
            justifyContent: "end",
            padding: "8px 16px",
            backgroundColor: "transparent",
          },
          "& .MuiTablePagination-root": {
            display: "flex",
            alignItems: "center",
            justifyContent: "end",
            width: "100%",
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              marginBottom: "0px",
            },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none !important",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "transparent!important",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "inherit !important", // Keeps the original row background on hover
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: `inherit !important`,
          },
        }}
      />
    </Grid>
  );
};

export default MuiTable;
