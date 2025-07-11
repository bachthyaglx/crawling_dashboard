import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material'
import Sidebar from './sidebar'
import instance from '../api/instance'

interface UrlEntry {
  url: string
  status: 'queued' | 'running' | 'done' | 'error' | 'stopped'
}

const Tasks: React.FC = () => {
  const [urlInput, setUrlInput] = useState('')
  const [urls, setUrls] = useState<UrlEntry[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    try {
      await instance.post('/api/urls', { url: urlInput })
      setUrls((prev) => [...prev, { url: urlInput, status: 'queued' }])
      setUrlInput('')
    } catch (err) {
      console.error('Add URL failed:', err)
    }
  }

  const handleStart = (url: string) => {
    return instance.post('/api/crawl', { url }).catch((err) => {
      console.error('Start failed:', err)
    })
  }

  const handleStop = (url: string) => {
    return instance.post('/api/stop', { url }).catch((err) => {
      console.error('Stop failed:', err)
    })
  }

  const handleDelete = (url: string) => {
    setUrls((prev) => prev.filter((u) => u.url !== url))
    setSelectedUrls((prev) => prev.filter((u) => u !== url))
  }

  const handleCheckboxToggle = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  const handleBatchAction = async (action: 'start' | 'stop' | 'delete') => {
    if (action === 'delete') {
      setUrls((prev) => prev.filter((u) => !selectedUrls.includes(u.url)))
      setSelectedUrls([])
      return
    }

    try {
      await Promise.all(
        selectedUrls.map((url) => {
          if (action === 'start') return handleStart(url)
          if (action === 'stop') return handleStop(url)
          return Promise.resolve()
        })
      )
      setSelectedUrls([])
    } catch (err) {
      console.error(`${action} failed`, err)
    }
  }

  const fetchProgress = async () => {
    try {
      const res = await instance.get('/api/progress')
      setProgress(res.data)
    } catch (err) {
      console.error('Failed to fetch progress:', err)
    }
  }

  useEffect(() => {
    const interval = setInterval(fetchProgress, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStatus = (url: string): string => {
    return progress[url] || 'queued'
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          URL Tasks
        </Typography>

        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <TextField
            label="Enter URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleAddUrl}>
            Add
          </Button>
        </Box>

        {selectedUrls.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button onClick={() => handleBatchAction('start')}>Start</Button>
            <Button onClick={() => handleBatchAction('stop')}>Stop</Button>
            <Button color="error" onClick={() => handleBatchAction('delete')}>Delete</Button>
          </Box>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {urls.length > 0 ? (
                urls.map((entry) => (
                  <TableRow key={entry.url}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUrls.includes(entry.url)}
                        onChange={() => handleCheckboxToggle(entry.url)}
                      />
                    </TableCell>
                    <TableCell>{entry.url}</TableCell>
                    <TableCell>{getStatus(entry.url)}</TableCell>
                    <TableCell>
                      {getStatus(entry.url) === 'queued' || getStatus(entry.url) === 'done' ? (
                        <Button variant="outlined" onClick={() => handleStart(entry.url)}>
                          Start
                        </Button>
                      ) : (
                        <Button variant="outlined" color="secondary" onClick={() => handleStop(entry.url)}>
                          Stop
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        sx={{ ml: 1 }}
                        onClick={() => handleDelete(entry.url)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No URLs added.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default Tasks
