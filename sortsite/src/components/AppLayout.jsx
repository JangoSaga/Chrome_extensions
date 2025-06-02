import { Outlet } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import React from 'react';
function AppLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export default AppLayout;
