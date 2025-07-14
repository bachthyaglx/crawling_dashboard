// src/components/Scrollbar/index.tsx

import { FC, ReactNode } from 'react';
import SimpleBarReact from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Box } from '@mui/material';

interface ScrollbarProps {
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

const Scrollbar: FC<ScrollbarProps> = ({ className, children, style }) => {
  return (
    <Box className={className} sx={{ height: '100%', overflow: 'hidden' }}>
      <SimpleBarReact style={{ maxHeight: '100%', ...style }}>
        {children}
      </SimpleBarReact>
    </Box>
  );
};

export default Scrollbar;
