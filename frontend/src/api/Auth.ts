// src/api/Auth.ts
import instance from './instance'

export const logout = async () => {
  return instance.post('/api/logout')
}