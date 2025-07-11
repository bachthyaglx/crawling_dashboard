import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton
} from '@mui/material'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import Sidebar from './sidebar'
import instance from '../api/instance'
import CloseIcon from '@mui/icons-material/Close'

// ✅ Custom hook to track window width and height
const useWindowSize = () => {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

interface Result {
  id?: number
  url: string
  html_version: string
  title: string
  internal_links: number
  external_links: number
  has_login_form: boolean
  status: string
  broken_links: { url: string; status: number }[]
  created_at: string
}

const Dashboard: React.FC = () => {
  const [rows, setRows] = useState<Result[]>([])
  const [search, setSearch] = useState('')
  const [selectedRow, setSelectedRow] = useState<Result | null>(null)

  const { width } = useWindowSize()
  const isCompact = width < 1000

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get('/api/urls')
        const rowsWithId = res.data.map((r: Result, index: number) => ({
          id: index,
          ...r
        }))
        setRows(rowsWithId)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      }
    }
    fetchData()
  }, [])

  const filteredRows = rows.filter((r) => {
    const lower = search.toLowerCase()
    return (
      r.title?.toLowerCase().includes(lower) ||
      r.html_version?.toLowerCase().includes(lower) ||
      r.url?.toLowerCase().includes(lower)
    )
  })

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'html_version', headerName: 'HTML Version', width: 150 },
    { field: 'internal_links', headerName: 'Internal Links', width: 150 },
    { field: 'external_links', headerName: 'External Links', width: 150 },
    {
      field: 'has_login_form',
      headerName: 'Login Form',
      width: 130,
      renderCell: (params) => (params.value ? 'Yes' : 'No')
    },
    { field: 'status', headerName: 'Status', width: 100 },
    { field: 'url', headerName: 'URL', flex: 1 }
  ]

  const pieData = selectedRow
    ? [
      { name: 'Internal Links', value: selectedRow.internal_links },
      { name: 'External Links', value: selectedRow.external_links }
    ]
    : []

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <TextField
          label="Global Search"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            overflowX: 'auto'
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 1200 }}>
            {isCompact ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredRows.map((row) => (
                  <Box
                    key={row.id}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: 2,
                      p: 2,
                      backgroundColor: '#f9f9f9',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedRow(row)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {row.title}
                    </Typography>
                    <Typography variant="body2">
                      <strong>HTML Version:</strong> {row.html_version}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Internal Links:</strong> {row.internal_links}
                    </Typography>
                    <Typography variant="body2">
                      <strong>External Links:</strong> {row.external_links}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Login Form:</strong> {row.has_login_form ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {row.status}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      <strong>URL:</strong> {row.url}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <DataGrid
                autoHeight
                rows={filteredRows}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10, page: 0 }
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sortingOrder={['asc', 'desc']}
                onRowClick={(params) => setSelectedRow(params.row)}
              />
            )}
          </Box>
        </Box>

        <Dialog
          open={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Details: {selectedRow?.title || 'Unknown'}
            <IconButton
              aria-label="close"
              onClick={() => setSelectedRow(null)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRow && (
              <>
                <Box sx={{ width: '100%', height: 300 }}>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </Box>

                {selectedRow.broken_links?.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Broken Links
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>URL</TableCell>
                          <TableCell>Status Code</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRow.broken_links.map((link, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{link.url}</TableCell>
                            <TableCell>{link.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Dashboard
