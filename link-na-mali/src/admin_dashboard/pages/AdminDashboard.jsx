import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CountUp from 'react-countup';
import {
  FaUsers,
  FaUserTie,
  FaUserAlt,
  FaUserShield,
  FaMapMarkedAlt,
  FaHome,
  FaBuilding,
  FaIndustry,
  FaBullhorn,
  FaTicketAlt,
  FaPlus,
  FaFileInvoice,
  FaBars,
  FaEnvelope,
  FaMailBulk,
} from 'react-icons/fa';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import ServiceProfiles from '../components/serviceProfiles/ServiceProfiles';
import Bookings from '../components/bookings/Bookings';
import Footer from '../components/Footer';
// Import the Tiers UI component
import TiersUI from '../components/pricing/Tiers';
import SendUserEmailModal from '../pages/AdminMessaging/SendUserEmailForm';
import SendBulkEmailModal from '../pages/AdminMessaging/SendBulkEmailForm';



const API_BASE_URL = 'https://api.linknamali.ke';
const PRICING_BASE_URL = 'https://linknamali.ke/pricing';

// Helper to format dates uniformly
const formatDate = dateStr => {
  const d = new Date(dateStr);
  return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Main counts
  const [totalUsers, setTotalUsers] = useState(0);
  const [owners, setOwners] = useState(0);
  const [buyers, setBuyers] = useState(0);
  const [agents, setAgents] = useState(0);
  const [providersCount, setProvidersCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  // Property counts
  const [propertyCounts, setPropertyCounts] = useState({ land: 0, houses: 0, apartments: 0, commercial: 0 });

  // Pricing tiers count
  const [pricingTiersCount, setPricingTiersCount] = useState(0);

  // Others
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [supportTickets, setSupportTickets] = useState([]);
  const [unapprovedProperties, setUnapprovedProperties] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [combinedActivities, setCombinedActivities] = useState([]);

  // Toggle views
  const [showServiceProfiles, setShowServiceProfiles] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Slideshow indices
  const [supportIndex, setSupportIndex] = useState(0);
  const [propertyIndex, setPropertyIndex] = useState(0);
  const [userIndex, setUserIndex] = useState(0);
  const [combinedIndex, setCombinedIndex] = useState(0);

  // Sidebar open/close
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleSidebarToggle = () => setIsSidebarOpen(open => !open);

  // emails
  const [showUserEmailModal, setShowUserEmailModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);


  useEffect(() => {
    async function fetchAll() {
      try {
        // Users
        const u = await axios.get(`${API_BASE_URL}/users`);
        const users = u.data.users || [];
        setTotalUsers(users.length);
        setOwners(users.filter(x => x.role === 'owner').length);
        setBuyers(users.filter(x => x.role === 'buyer').length);
        setAgents(users.filter(x => x.role === 'agent').length);
        setRecentUsers(users.map(x => ({ id: x.user_id, title: `${x.first_name} ${x.last_name}`, status: 'Joined', date: x.created_at })));

        // Properties
        const propRes = await axios.get(`${API_BASE_URL}/property/get-all-approved-properties`);
        const props = propRes.data.data || [];
        const counts = props.reduce((acc, item) => {
          const type = (item.property_type || '').toLowerCase();
          if (type === 'land') acc.land++;
          else if (type === 'house' || type === 'houses') acc.houses++;
          else if (type === 'apartment' || type === 'apartments') acc.apartments++;
          else if (type === 'commercial') acc.commercial++;
          return acc;
        }, { land: 0, houses: 0, apartments: 0, commercial: 0 });
        setPropertyCounts(counts);
        const up = await axios.get(`${API_BASE_URL}/property/getallunapprovedproperty`);
        setUnapprovedProperties((up.data.data || []).map(x => ({ id: x.id, title: x.title, status: 'Pending Approval', date: x.created_at })));

        // Ads
        const a = await axios.get(`${API_BASE_URL}/all-ads`);
        setActiveAdsCount((a.data.all_ads || []).filter(x => x.status?.toLowerCase() === 'approved').length);

        // Support
        const t = await axios.get(`${API_BASE_URL}/support/tickets`);
        setSupportTickets((t.data.tickets || []).map(x => ({ id: x.id, title: x.subject, status: x.status, date: x.created_at })));

        // Service Providers
        const p = await axios.get(`${API_BASE_URL}/allserviceproviders`);
        const prov = Array.isArray(p.data) ? p.data : p.data.providers || [];
        setProvidersCount(prov.length);

        // Bookings
        const b = await axios.get(`${API_BASE_URL}/bookings/getallbookings`);
        setBookingCount((b.data.data || []).length);

        // Pricing tiers
        const pr = await axios.get(`${PRICING_BASE_URL}/fetchpremiumtiers`);
        setPricingTiersCount(pr.data.tiers.length);

        // Combined activities
        setCombinedActivities([...supportTickets, ...unapprovedProperties]);
      } catch (e) {
        console.error(e);
      }
    }
    fetchAll();
  }, []);

  // slideshows
  useEffect(() => { const id = setInterval(() => setSupportIndex(i => (i + 1) % supportTickets.length), 5000); return () => clearInterval(id); }, [supportTickets]);
  useEffect(() => { const id = setInterval(() => setPropertyIndex(i => (i + 1) % unapprovedProperties.length), 5000); return () => clearInterval(id); }, [unapprovedProperties]);
  useEffect(() => { const id = setInterval(() => setUserIndex(i => (i + 1) % recentUsers.length), 5000); return () => clearInterval(id); }, [recentUsers]);
  useEffect(() => { const id = setInterval(() => setCombinedIndex(i => (i + 1) % combinedActivities.length), 5000); return () => clearInterval(id); }, [combinedActivities]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AdminSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <div className="flex-1 p-6 pt-36 md:pt-40 bg-gray-50 bg-opacity-50 rounded-tr-lg rounded-br-lg relative">
        <button onClick={handleSidebarToggle} className="md:hidden absolute top-4 left-4 p-2 text-2xl bg-white bg-opacity-75 rounded-full shadow text-[#29327E]">
          <FaBars />
        </button>
        <Header onSidebarToggle={handleSidebarToggle} />
        <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center md:text-left">Admin Dashboard</h1>

        {!showServiceProfiles && !showBookings && !showPricing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <Card icon={<FaUsers />}        label="Total Users"       count={totalUsers}        onClick={() => navigate('/admin-dashboard/UserManagement')} />
            <Card icon={<FaUserShield />}   label="Owners"            count={owners}            onClick={() => navigate('/admin-dashboard/UserManagement')} />
            <Card icon={<FaUserAlt />}      label="Buyers"            count={buyers}            onClick={() => navigate('/admin-dashboard/UserManagement')} />
            <Card icon={<FaUserTie />}      label="Agents"            count={agents}            onClick={() => navigate('/admin-dashboard/UserManagement')} />
            <Card icon={<FaMapMarkedAlt />} label="Land Properties"   count={propertyCounts.land} onClick={() => navigate('/admin-dashboard/AdminPropertyManagement')} />
            <Card icon={<FaHome />}         label="Houses"            count={propertyCounts.houses} onClick={() => navigate('/admin-dashboard/AdminPropertyManagement')} />
            <Card icon={<FaBuilding />}     label="Apartments"        count={propertyCounts.apartments} onClick={() => navigate('/admin-dashboard/AdminPropertyManagement')} />
            <Card icon={<FaIndustry />}     label="Commercial"        count={propertyCounts.commercial} onClick={() => navigate('/admin-dashboard/AdminPropertyManagement')} />
            <Card icon={<FaBullhorn />}     label="Active Ads"        count={activeAdsCount}    onClick={() => navigate('/admin-dashboard/adminadscenter')} />
            <Card icon={<FaTicketAlt />}    label="Support Tickets"   count={supportTickets.length} onClick={() => navigate('/admin-dashboard/AdminSupport')} />
            <Card icon={<FaPlus />}         label="Service Providers" count={providersCount}    animate onClick={() => setShowServiceProfiles(true)} />
            <Card icon={<FaFileInvoice />}  label="Bookings"          count={bookingCount}      animate onClick={() => setShowBookings(true)} />
            {/* Pricing Tiers card */}
            <Card icon={<FaFileInvoice />}  label="Pricing Tiers"      count={pricingTiersCount}  onClick={() => setShowPricing(true)} />
            <Card
              icon={<FaMailBulk />} 
              label="Send Bulk Email"
              count=""
              onClick={() => setShowBulkEmailModal(true)}
            />
            <Card
              icon={<FaEnvelope />} 
              label="Send Email to User"
              count=""
              onClick={() => setShowUserEmailModal(true)}
            />


          </div>
        )}

        {showServiceProfiles && <DetailView onBack={() => setShowServiceProfiles(false)}><ServiceProfiles /></DetailView>}
        {showBookings       && <DetailView onBack={() => setShowBookings(false)}><Bookings /></DetailView>}
        {showPricing        && <DetailView onBack={() => setShowPricing(false)}><TiersUI /></DetailView>}

        {!showServiceProfiles && !showBookings && !showPricing && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Recent Activities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActivityCard activity={supportTickets[supportIndex]} onClick={() => navigate('/admin-dashboard/AdminSupport')} />
              <ActivityCard activity={unapprovedProperties[propertyIndex]} onClick={() => navigate('/admin-dashboard/AdminNewListings')} />
              <ActivityCard activity={recentUsers[userIndex]} onClick={() => navigate('/admin-dashboard/UserManagement')} />
              <ActivityCard activity={combinedActivities[combinedIndex]} onClick={() => navigate('/')} />
            </div>
          </div>
        )}

        <Footer />
        

        {showUserEmailModal && (
          <SendUserEmailModal
            isOpen={showUserEmailModal}
            onClose={() => setShowUserEmailModal(false)}
          />
        )}

        {showBulkEmailModal && (
          <SendBulkEmailModal
            isOpen={showBulkEmailModal}
            onClose={() => setShowBulkEmailModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// DetailView helper
const DetailView = ({ onBack, children }) => (
  <div className="mt-6">
    <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700">← Back</button>
    {children}
  </div>
);

// Card component with branded blue styling
const Card = ({ icon, label, count, onClick, animate = false }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-lg shadow cursor-pointer transform transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg border-l-8 border-[#29327E] hover:border-[#29327E]"
  >
    <div className="flex items-center space-x-4">
      <div className="text-3xl text-[#29327E]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-[#29327E]">{label}</p>
        <p className="text-2xl font-bold text-[#29327E]">
          {animate ? <CountUp end={count} duration={1.5} /> : count}
        </p>
      </div>
    </div>
  </div>
);


// ActivityCard with branded blue styling
const ActivityCard = ({ activity = {}, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-6 rounded-lg shadow cursor-pointer transform transition duration-300 ease-out hover:shadow-lg border-l-8 border-[#29327E] hover:border-[#29327E]"
  >
    {activity ? (
      <>
        <h4 className="text-lg font-semibold mb-2 text-[#29327E]">{activity.title}</h4>
        <p className="text-sm mb-1 text-gray-600">Status: <span className="font-medium capitalize">{activity.status}</span></p>
        <p className="text-xs text-gray-500">{activity.date ? formatDate(activity.date) : ''}</p>
      </>
    ) : (
      <p className="text-center text-gray-500">No Activity</p>
    )}
  </div>
);

export default AdminDashboard;
