import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Dashboard from "./Pages/Dashboard";
import Goals from "./Pages/Goals";
import AppLayout from "./Pages/AppLayout";
import SiteSettings from "./Pages/SiteSettings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/site-settings" element={<SiteSettings />} />
          <Route path="*" element={<Navigate to={"/"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
/*
APP:
-header: header and navbar
-DASHBOARD: screentime, focus percentage,
-SITES SETTINGS: add,edit, delete sites, categorize them as work, personal, etc.
-GOALS: set goals, track progress, set reminders
-footer: footer
*/
