
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { routes } from './config';
import { RouteTransition } from '@/components/ui/route-transition';

export function AppRoutes() {
  const location = useLocation();
  
  return (
    <RouteTransition>
      <Routes location={location}>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}
      </Routes>
    </RouteTransition>
  );
}
