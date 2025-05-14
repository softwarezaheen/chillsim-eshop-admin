import {
  Card,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const columns = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "name", headerName: "Name", flex: 1 },
  { field: "age", headerName: "Age", width: 120 },
  { field: "age", headerName: "Age", width: 120 },
  { field: "age", headerName: "Age", width: 120 },
];

const rows = [
  { id: 1, name: "John Doe", age: 25 },
  { id: 2, name: "Jane Smith", age: 30 },
  { id: 3, name: "Michael Brown", age: 35 },
  { id: 4, name: "Michael Brown", age: 35 },
  { id: 5, name: "Michael Brown", age: 35 },
];

const PreviewTables = () => {
  return (
    <div className="p-6 space-y-6">
      <Card sx={{ padding: 2, border: "1px solid", borderColor: "divider" }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.age}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ padding: 2, border: "1px solid", borderColor: "divider" }}>
        <DataGrid rows={rows} columns={columns} autoHeight />
      </Card>
    </div>
  );
};

export default PreviewTables;
