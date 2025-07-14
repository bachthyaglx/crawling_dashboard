import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { RouteObject } from 'react-router';

import SidebarLayout from 'src/layouts/SidebarLayout';
import BaseLayout from 'src/layouts/BaseLayout';
import SuspenseLoader from 'src/components/SuspenseLoader';
import Auth from 'src/auth';

const Loader = (Component) => (props) =>
(
  <Suspense fallback={<SuspenseLoader />}>
    <Component {...props} />
  </Suspense>
);

// Pages
const Login = Loader(lazy(() => import('src/pages/login')));

// Dashboards
const Tasks = Loader(lazy(() => import('src/pages/tasks')));

// Applications
const Transactions = Loader(lazy(() => import('src/pages/transactions')));

const routes: RouteObject[] = [
  {
    path: '',
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <Login />
      },
      {
        path: 'login',
        element: <Navigate to="/" replace />
      }
    ]
  },
  {
    path: 'dashboards',
    element: (
      <Auth>
        <SidebarLayout />
      </Auth>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="tasks" replace />
      },
      {
        path: 'tasks',
        element: <Tasks />
      }
    ]
  },
  {
    path: 'management',
    element: (
      <Auth>
        <SidebarLayout />
      </Auth>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="transactions" replace />
      },
      {
        path: 'transactions',
        element: <Transactions />
      }
    ]
  }
];

export default routes;
