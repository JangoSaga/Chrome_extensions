/* eslint-disable no-unused-vars */
import React from 'react';
import AppLayout from './components/AppLayout';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Main from './components/Main';
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Main />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
