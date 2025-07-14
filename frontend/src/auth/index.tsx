// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactElement;
}

const Auth: React.FC<Props> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default Auth;
// 