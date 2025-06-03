import { Outlet } from 'react-router-dom';
import React from 'react';
function AppLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export default AppLayout;
