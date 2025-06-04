/* eslint-disable no-unused-vars */
import React from 'react';
import AppLayout from './components/AppLayout';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
function App() {
  return (
    // <HashRouter>
    //   <Routes>
    //     <Route element={<AppLayout />}>
    //       <Route index path="/" element={<Dashboard />} />
    //       <Route path="/goals" element={<Goals />} />
    //       <Route path="/site-settings" element={<SiteSettings />} />
    //       <Route path="*" element={<Navigate to={'/'} replace />} />
    //     </Route>
    //   </Routes>
    // </HashRouter>
    <Dashboard />
  );
}

export default App;
