import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import FleetDashboard from "./pages/FleetDashboard";
import EngineBlueprint from "./pages/EngineBlueprint";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/fleet" replace />} />
          <Route path="fleet" element={<FleetDashboard />} />
          <Route path="engine/:engineId" element={<EngineBlueprint />} />
          <Route path="engine/:engineId/part/:partId" element={<div className="p-8 text-text-primary">Part Expanded View</div>} />
          
          <Route path="reports" element={<div className="p-8 text-text-primary">Reports Module</div>} />
          <Route path="alerts" element={<div className="p-8 text-text-primary">Alerts Log</div>} />
          <Route path="settings" element={<div className="p-8 text-text-primary">Settings</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
