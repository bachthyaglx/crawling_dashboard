import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
  useTheme
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

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

interface DetailsDialogProps {
  open: boolean;
  onClose: () => void;
  row: Result | null;
}

const Analysis: FC<DetailsDialogProps> = ({ open, onClose, row }) => {
  const theme = useTheme();

  if (!row) return null;

  const pieData = [
    { name: 'Internal Links', value: row.internal_links },
    { name: 'External Links', value: row.external_links }
  ];

  const barData = [
    { type: 'Internal', count: row.internal_links },
    { type: 'External', count: row.external_links }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'background.paper',
          color: 'text.primary',
          p: 2,
          borderRadius: 2
        }
      }}
    >
      <DialogContent>
        <Typography variant="h5" gutterBottom>
          Internal vs External Links Analysis
        </Typography>

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4} mt={2}>
          {/* Pie Chart */}
          <Box flex={1}>
            <PieChart width={300} height={250}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                <Cell fill="#8884d8" />
                <Cell fill="#82ca9d" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Box>

          {/* Bar Chart */}
          <Box flex={1}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Link Count">
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'External' ? '#82ca9d' : '#8884d8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Broken Links Table */}
        {row.broken_links?.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Broken Links
            </Typography>
            <TableContainer sx={{ border: '1px solid #ccc' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.broken_links.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.url}</TableCell>
                      <TableCell>{item.status_code}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Analysis;
