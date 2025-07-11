// src/hooks/useUrls.ts
import { useEffect, useState } from 'react'
import { fetchUrls } from '../api/Urls'
import type { UrlItem } from '../types/Url'

export const useUrls = (interval = 3000) => {
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await fetchUrls()
      setUrls(data)
    } catch (e) {
      console.error('Fetch URLs failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, interval)
    return () => clearInterval(timer)
  }, [interval])

  return { urls, loading, reload: load }
}
