import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/login/Login';
import Signup from './components/register/Signup';
import Dashboard from './pages/dashboard/Dashboard';
import PropertyManagement from './components/property/PropertyManager';
import LeadManagement from './components/lead/LeadManager';
import ProfileManagement from './components/profile/ProfileManager';
import ReportsAnalytics from './components/analytics/Analytics';
import Support from './components/support/Support';
import Settings from './components/settings/Settings';
import Logout from './components/logout/Logout';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route path="property-management" element={<PropertyManagement />} />
            <Route path="lead-management" element={<LeadManagement />} />
            <Route path="profile-management" element={<ProfileManagement />} />
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