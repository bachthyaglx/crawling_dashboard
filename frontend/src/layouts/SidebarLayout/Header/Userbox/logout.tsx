import instance from '../../../../api/instance';
import { NavigateFunction } from 'react-router-dom';

export const handleLogout = async (navigate: NavigateFunction) => {
  try {
    await instance.post('/api/logout');
    localStorage.removeItem('token');
    navigate('/');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};