//UTILITIES
import React from "react";
//COMPONENT
import {
  TableSortLabel,
  TableRow,
  TableCell,
  TableHead,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export function TableCustomHeader(props) {
  const { headers, actions } = props;
  const { orderBy, sortedBy, requestSort, onAdd } = props;

  const handleRequestSort = (item) => {
    requestSort(item);
  };

  return (
    <TableHead>
      <TableRow>
        {headers?.map((item, index) => (
          <TableCell
            key={index} // NOSONAR
            sortDirection={sortedBy === item.sorted ? orderBy : false}
          >
            {item.sorted ? (
              <TableSortLabel
                direction={sortedBy === item.sorted ? orderBy : "asc"}
                active={sortedBy === item.sorted}
                onClick={(e) => handleRequestSort(item.sorted)}
              >
                {item.name}
              </TableSortLabel>
            ) : item.customContent ? (
              item.customContent
            ) : (
              item.name
            )}
          </TableCell>
        ))}
        {actions && (
          <TableCell align="right">
            {onAdd && (
              <Tooltip title={"Add new"} placement={"top"}>
                <IconButton
                  color="primary"
                  aria-label="add"
                  onClick={(event) => {
                    onAdd();
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
}

export default TableCustomHeader;
