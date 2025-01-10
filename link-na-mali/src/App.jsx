import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/login'
import Signup from './components/register'
import Dashboard from './pages/dashboard'
import PropertyManagement from './components/property'
import LeadManagement from './components/lead'
import ReportsAnalytics from './components/analytics'
import Support from './components/support'
import Settings from './components/settings'
import Logout from './components/logout'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route path="property-management" element={<PropertyManagement />} />
            <Route path="lead-management" element={<LeadManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="support" element={<Support />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logout" element={<Logout />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;