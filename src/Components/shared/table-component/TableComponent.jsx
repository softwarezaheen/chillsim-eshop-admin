import {
  Table,
  TableBody,
  TableContainer
} from "@mui/material";
import NoDataFound from "../fallbacks/no-data-found/NoDataFound";
import TableSkeletons from "../skeletons/TableSkeletons";
import TableCustomHeader from "./TableCustomHeader";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";


const TableComponent = (props) => {
  const {
    noDataFound = "No Data Found",
    tableHeaders = [],
    children,
    dataPerPage = 10,
    tableData = [],
    loading = false,
    requestSort,
  } = props;

  const handleSortRequest = (value) => {
    requestSort(value);
  };

  return (
    <div className={"flex flex-col gap-[1rem]"}>
      <TableContainer>
        <Table>
          <TableCustomHeader
            {...props}
            requestSort={handleSortRequest}
            headers={tableHeaders}
          />
          {!loading && tableData?.length !== 0 && (
            <TableBody>{children}</TableBody>
          )}
        </Table>
        {!loading && tableData?.length === 0 && (
          <div className="flex flex-row justify-center items-center h-[100px] break-all p-6">
            <NoDataFound
              height={200}
              width={200}
              row={true}
              text={noDataFound}
              image={<DoDisturbIcon fontSize="small" />}
            />
          </div>
        )}
        {loading && <TableSkeletons count={dataPerPage} />}
      </TableContainer>
    </div>
  );
};

export default TableComponent;
