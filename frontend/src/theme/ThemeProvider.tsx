// src/theme/ThemeProvider.tsx

import React, { useState, ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { themeCreator } from './base';

export const ThemeContext = React.createContext((themeName: string): void => { });

interface Props {
  children: ReactNode;
}

const ThemeProviderWrapper: React.FC<Props> = ({ children }) => {
  const curThemeName = localStorage.getItem('appTheme') || 'NebulaFighterTheme';
  const [themeName, _setThemeName] = useState(curThemeName);
  const theme = themeCreator(themeName);

  const setThemeName = (themeName: string): void => {
    localStorage.setItem('appTheme', themeName);
    _setThemeName(themeName);
  };

  return (
    <ThemeContext.Provider value={setThemeName}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProviderWrapper;
