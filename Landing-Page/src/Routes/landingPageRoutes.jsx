import React from "react";
import { Routes, Route } from "react-router-dom";
import Main from '../Pages/main'
import DetailsDisplay from '../Pages/DetailsDisplay'
function LandingPageRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/:type/:name/*" element={<DetailsDisplay />} />
    </Routes>
  );
}

export default LandingPageRoutes;
