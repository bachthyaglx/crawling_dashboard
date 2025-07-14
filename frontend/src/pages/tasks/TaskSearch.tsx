import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import { useEffect, useState } from 'react';
import instance from '../../api/instance';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addUrl, removeUrl } from '../../store/urlSlice';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';

interface UrlEntry {
  url: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'stopped';
}

const TaskSearch = () => {
  const dispatch = useAppDispatch();
  const urls = useAppSelector((state) => state.urls);

  const [urlInput, setUrlInput] = useState('');
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [currentlyRunning, setCurrentlyRunning] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [queueActive, setQueueActive] = useState(false);

  const isValidURL = (url: string) => /^https?:\/\/\S+$/.test(url);

  const handleAddUrl = async () => {
    if (!urlInput.trim() || !isValidURL(urlInput)) return;
    try {
      await instance.post('/api/urls', { url: urlInput });
      dispatch(addUrl({ url: urlInput, status: 'queued' }));
      setUrlInput('');
    } catch (err) {
      console.error('Add URL failed:', err);
    }
  };

  const handleStart = async (url: string) => {
    try {
      await instance.post('/api/crawl', { url });
      setCurrentlyRunning(url);
    } catch (err) {
      console.error('Start failed:', err);
    }
  };

  const handleStop = async (url: string) => {
    try {
      await instance.post('/api/stop', { url });
      setCurrentlyRunning(null);
      setQueueActive(false);
    } catch (err) {
      console.error('Stop failed:', err);
    }
  };

  const handleDelete = (url: string) => {
    dispatch(removeUrl(url));
    setSelectedUrls((prev) => prev.filter((u) => u !== url));
    if (url === currentlyRunning) setCurrentlyRunning(null);
  };

  const handleSelectUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const fetchProgress = async () => {
    try {
      const res = await instance.get('/api/progress');
      setProgress(res.data);

      Object.entries(res.data).forEach(([url, status]) => {
        dispatch(addUrl({ url, status: status as UrlEntry['status'] }));
      });

      const running = Object.entries(res.data).find(([, status]) => status === 'running');
      setCurrentlyRunning(running?.[0] || null);
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    }
  };

  const waitForCompletion = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const currentStatus = getStatus(url);
        if (currentStatus === 'done' || currentStatus === 'error') {
          clearInterval(interval);
          resolve();
        }
      }, 2000);
    });
  };

  useEffect(() => {
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (url: string) => {
    const entry = urls.find((u) => u.url === url);
    return entry?.status || 'queued';
  };

  const getChipColor = (status: string) => {
    if (status === 'done') return 'success';
    if (status === 'error') return 'error';
    return 'default';
  };

  return (
    <>
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Manage Crawling Tasks
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <TextField
                size="small"
                label="Add URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                sx={{ width: 300 }}
                error={!!urlInput && !isValidURL(urlInput)}
                helperText={
                  urlInput && !isValidURL(urlInput) ? 'Enter valid URL (http, https, etc..)' : ''
                }
              />
              <Button
                variant="contained"
                onClick={handleAddUrl}
                disabled={!isValidURL(urlInput)}
              >
                Add
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedUrls.length > 0 && selectedUrls.length < urls.length
                  }
                  checked={urls.length > 0 && selectedUrls.length === urls.length}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setSelectedUrls(isChecked ? urls.map((u) => u.url) : []);
                  }}
                  disabled={!!currentlyRunning}
                />
              </TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {urls.length > 0 ? (
              urls.map((entry) => {
                const status = getStatus(entry.url);
                const isThisRunning = currentlyRunning === entry.url;
                const anotherRunning = !!currentlyRunning && !isThisRunning;

                return (
                  <TableRow key={entry.url}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUrls.includes(entry.url)}
                        onChange={() => handleSelectUrl(entry.url)}
                        disabled={!!currentlyRunning}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        color: anotherRunning ? '#999' : 'inherit',
                      }}
                    >
                      {entry.url}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status}
                        color={getChipColor(status)}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          backgroundColor: anotherRunning ? '#e0e0e0' : undefined,
                          color: anotherRunning ? '#999' : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={async () => {
                          setQueueActive(true);
                          const urlsToCrawl =
                            selectedUrls.length > 0 && selectedUrls.includes(entry.url)
                              ? selectedUrls
                              : [entry.url];

                          for (const url of urlsToCrawl) {
                            await handleStart(url);
                            await waitForCompletion(url);
                          }

                          setQueueActive(false);
                        }}
                        disabled={!!currentlyRunning}
                        color="primary"
                      >
                        <PlayArrowIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleStop(entry.url)}
                        disabled={entry.url !== currentlyRunning}
                        color={entry.url === currentlyRunning ? 'error' : 'default'}
                      >
                        <StopIcon />
                      </IconButton>

                      <IconButton
                        onClick={() => handleDelete(entry.url)}
                        disabled={!!currentlyRunning}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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

      <Box sx={{ pt: 4 }} display="flex" alignItems="center" justifyContent="center">
        <Pagination count={1} size="large" shape="rounded" color="primary" />
      </Box>
    </>
  );
};

export default TaskSearch;
