import { FC, ChangeEvent, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  TextField,
  TableSortLabel
} from '@mui/material';
import { format } from 'date-fns';
import Label from 'src/components/Label';
import instance from '../../api/instance';
import Analysis from 'src/components/Analysis';

interface BrokenLink {
  url: string;
  status_code: number;
}

interface Result {
  id?: number;
  url: string;
  html_version: string;
  title: string;
  internal_links: number;
  external_links: number;
  has_login_form: boolean;
  status: string;
  broken_links: BrokenLink[];
  created_at: string;
}

const getStatusLabel = (status: string): JSX.Element => {
  const map = {
    done: { text: 'Done', color: 'success' },
    error: { text: 'Error', color: 'error' },
    queued: { text: 'Queued', color: 'warning' },
    running: { text: 'Running', color: 'primary' }
  };
  const { text, color }: any = map[status] || { text: status, color: 'default' };
  return <Label color={color}>{text}</Label>;
};

const ListScrawling: FC = () => {
  const [rows, setRows] = useState<Result[]>([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Result | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<Result | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get('/api/urls');
        const rowsWithId = res.data.map((r: Result, index: number) => ({
          id: index,
          ...r
        }));
        setRows(rowsWithId);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    fetchData();
  }, []);

  const handlePageChange = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value));
  };

  const handleSort = (field: keyof Result) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.title?.toLowerCase().includes(q) ||
      row.url?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q) ||
      row.html_version?.toLowerCase().includes(q) ||
      row.created_at?.toLowerCase().includes(q) ||
      row.internal_links.toString().includes(q) ||
      row.external_links.toString().includes(q) ||
      (row.has_login_form ? 'yes' : 'no').includes(q)
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const paginatedRows = sortedRows.slice(page * limit, page * limit + limit);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredRows.length / limit) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredRows.length, limit, page]);

  const columns: { label: string; field: keyof Result }[] = [
    { label: 'Title', field: 'title' },
    { label: 'HTML Version', field: 'html_version' },
    { label: 'Internal Links', field: 'internal_links' },
    { label: 'External Links', field: 'external_links' },
    { label: 'Login Form', field: 'has_login_form' },
    { label: 'Status', field: 'status' },
    { label: 'Created At', field: 'created_at' }
  ];

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Search Section */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Crawled URLs
        </Typography>
        <TextField
          label="Search across all columns"
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Table Section */}
      <Card>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map(({ label, field }) => (
                  <TableCell
                    key={field}
                    sortDirection={sortField === field ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortField === field}
                      direction={sortField === field ? sortDirection : 'asc'}
                      onClick={() => handleSort(field)}
                    >
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedRow(row);
                    setDialogOpen(true);
                  }}
                >
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.html_version}</TableCell>
                  <TableCell>{row.internal_links}</TableCell>
                  <TableCell>{row.external_links}</TableCell>
                  <TableCell>{row.has_login_form ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{getStatusLabel(row.status)}</TableCell>
                  <TableCell>
                    {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box p={2}>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={limit}
            onRowsPerPageChange={handleLimitChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Card>

      {/* Details Dialog */}
      <Analysis
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        row={selectedRow}
      />
    </Box>
  );
};

export default ListScrawling;
