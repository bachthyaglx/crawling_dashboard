// src/components/Details.tsx
import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface BrokenLink {
  url: string
  status: number
}

interface Props {
  row: {
    title: string
    internal_links: number
    external_links: number
    broken_links?: BrokenLink[]
  }
}

const Details: React.FC<Props> = ({ row }) => {
  const pieData = [
    { name: 'Internal Links', value: row.internal_links },
    { name: 'External Links', value: row.external_links }
  ]

  return (
    <>
      <Box sx={{ width: '100%', height: 300 }}>
        <Typography variant="h6" gutterBottom>Internal vs External Links</Typography>
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

      <Box sx={{ mt: 6 }}>
        {(row.broken_links && row.broken_links.length > 0) && (
          <>
            <Typography variant="h6" gutterBottom>Broken Links</Typography>
            <TableContainer>
              <Table size="small" sx={{ border: '1px solid #ccc' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.broken_links.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.url}</TableCell>
                      <TableCell>{item.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </>
  )
}

export default Details
