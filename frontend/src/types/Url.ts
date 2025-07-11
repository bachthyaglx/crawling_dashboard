// src/types/Url.ts
export type UrlItem = {
  id: number
  url: string
  status: 'queued' | 'running' | 'done' | 'error'
  title?: string
  html_version?: string
  internal_links?: number
  external_links?: number
}