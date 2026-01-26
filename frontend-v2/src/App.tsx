/**
 * App Component
 *
 * Main application component with routing configuration.
 * Uses React Router for navigation between pages.
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeDashboard } from './pages/HomeDashboard';

/**
 * App component - routing setup
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Dashboard - main landing page */}
        <Route path="/" element={<HomeDashboard />} />

        {/* Other routes will be added in future plans:
            /plan - ConversationalPlanning page
            /project/:id - ProjectWorkspace page
            etc.
        */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
