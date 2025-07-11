import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/Auth'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width:500px)')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    handleMenuClose()
  }

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('token')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (isDesktop) {
    return (
      <Box sx={{ width: 240, height: '100vh', bgcolor: '#121212', color: '#fff', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Navigation
        </Typography>
        <List>
          <ListItemButton onClick={() => navigate('/tasks')}>
            <ListItemText primary="Tasks" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/dashboard')}>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </List>
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
        <Button variant="outlined" color="inherit" fullWidth onClick={handleLogout}>
          Log out
        </Button>
      </Box>
    )
  }

  // Mobile dropdown menu from AppBar
  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: '#121212' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Menu
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* spacing for AppBar */}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => handleNavigate('/tasks')}>Tasks</MenuItem>
        <MenuItem onClick={() => handleNavigate('/dashboard')}>Dashboard</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>Log out</MenuItem>
      </Menu>
    </>
  )
}

export default Sidebar
