// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Tasks from './pages/tasks'
import Dashboard from './pages/dashboard'
import Details from './pages/details'

function App() {
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/tasks" /> : <Login />} />
        <Route path="/tasks" element={isAuthenticated ? <Tasks /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
        <Route
          path="/details/:id"
          element={
            isAuthenticated ? (
              <Details
                row={{
                  title: '',
                  internal_links: 0,
                  external_links: 0,
                  broken_links: []
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
