// src/api/urls.ts
import axios from './instance'
import type { UrlItem } from '../types/Url'

export const fetchUrls = async (): Promise<UrlItem[]> => {
  const res = await axios.get('/api/urls')
  return Array.isArray(res.data) ? res.data : []
}

export const addUrl = async (url: string): Promise<void> => {
  await axios.post('/api/urls', { url })
}

export const stopCrawling = async (url: string): Promise<void> => {
  await axios.post('/api/urls/stop', { url })
}
