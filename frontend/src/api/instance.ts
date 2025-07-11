// src/api/instance.ts
import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8080', // or use import.meta.env.VITE_API_URL
  withCredentials: true, // Enable cookies for CORS requests
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance
