/* eslint-disable no-unused-vars */
import React from 'react';
import AppLayout from './components/AppLayout';
import Home from './components/Home';
import { HashRouter, Route, Routes } from 'react-router-dom';
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
