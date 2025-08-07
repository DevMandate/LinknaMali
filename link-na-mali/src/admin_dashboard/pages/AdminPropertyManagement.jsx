import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, AlertCircle, Link, X } from 'lucide-react'; // Changed LinkOff to X
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';

const PRIMARY_COLOR   = '#29327E';
const SECONDARY_COLOR = '#35BEBD';

const styles = {
  container: open => ({
    display: 'flex',
    flexDirection: 'column',
    margin: 10,
    marginLeft: open ? 250 : 10,
    paddingTop: 120,
    transition: 'margin-left 0.3s',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f4f6fa',
    minHeight: '100vh',
  }),
  overlay: {
    position: 'fixed',
    top: 0,
    left: 250,
    width: 'calc(100% - 250px)',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 900,
  },
  welcome:       { textAlign: 'center', marginBottom: 40, color: PRIMARY_COLOR },
  newBtn:        { backgroundColor: SECONDARY_COLOR, color: '#fff', padding: '12px 24px', fontSize: '1.1rem', borderRadius: 5, textDecoration: 'none' },
  cards:         { display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 40, justifyContent: 'space-between' },
  card:          bg => ({ backgroundColor: bg, borderRadius: 12, padding: 20, textAlign: 'center', flex: '1 1 23%', minWidth: 280, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', color: '#fff', fontWeight: 'bold', transition: 'transform 0.3s' }),
  filters:       { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30, marginBottom: 10, alignItems: 'center' },
  input:         { padding: '8px', border: '1px solid #ccc', borderRadius: 4, fontSize: '1rem' },
  tableWrap:     { overflowX: 'auto', marginTop: 20 },
  table:         { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  th:            { padding: 14, textAlign: 'left', backgroundColor: PRIMARY_COLOR, color: '#fff', borderBottom: '1px solid #ddd' },
  td:            { padding: 14, textAlign: 'left', borderBottom: '1px solid #ddd' },
  iconBtn:       { background: 'none', border: 'none', cursor: 'pointer', padding: 4, margin: '0 4px' },
  detailCard:    { backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 20, margin: '10px 0 30px', color: '#333' },
  detailTitle:   { fontSize: '1.5rem', marginBottom: 10, color: PRIMARY_COLOR },
  detailRow:     { marginBottom: 8 },
  modalOverlay:  { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent:  { backgroundColor: '#fff', borderRadius: 8, padding: 30, width: '90%', maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  modalIcon:     { marginBottom: 16, color: SECONDARY_COLOR },
  modalText:     { fontSize: '1.2rem', marginBottom: 24, color: '#333' },
  btnGroup:      { display: 'flex', justifyContent: 'space-around' },
  btnCancel:     { backgroundColor: '#ccc', color: '#333', padding: '10px 20px', border: 'none', borderRadius: 5, cursor: 'pointer' },
  btnConfirm:    { backgroundColor: '#ff4444', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: 5, cursor: 'pointer' },
  success:       { position: 'fixed', top: 20, right: 20, padding: '10px 20px', backgroundColor: '#4CAF50', color: '#fff', borderRadius: 4, zIndex: 1000 },
};

const PropertyManagement = () => {
  const [allProps, setAllProps]           = useState([]);
  const [propsData, setPropsData]         = useState([]);
  const [counts, setCounts]               = useState({ land:0, houses:0, apartments:0, commercial:0 });
  const [agentsMap, setAgentsMap]         = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [open, setOpen]                   = useState(false);
  const [success, setSuccess]             = useState('');
  const [expanded, setExpanded]           = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [toDeleteId, setToDeleteId]       = useState(null);
 const navigate = useNavigate();
  // Search & filter states
  const [search, setSearch]               = useState('');
  const [bedFilter, setBedFilter]         = useState('');
  const [dateFilter, setDateFilter]       = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('selectedAgent');
      if (stored) setSelectedAgent(JSON.parse(stored));
    } catch (_){}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('https://api.linknamali.ke/property/get-all-approved-properties'),
      axios.get('https://api.linknamali.ke/fetchlistingagents')
    ])
    .then(([propRes, agentRes]) => {
      const listings = propRes.data.data || [];
      setAllProps(listings);
      setCounts({
        land:      listings.filter(p=>p.property_type==='land').length,
        houses:    listings.filter(p=>p.property_type==='houses').length,
        apartments:listings.filter(p=>p.property_type==='apartments').length,
        commercial:listings.filter(p=>p.property_type==='commercial').length,
      });
      const map = {};
      (agentRes.data.agents||[]).forEach(a => { map[a.agent_id] = a.name; });
      setAgentsMap(map);
    })
    .catch(err => console.error('Fetch error:', err))
    .finally(() => setLoading(false));
  }, []);

  const selectType = type =>
    setPropsData(allProps.filter(p => p.property_type === type));

  // include bedrooms in the global search
  const filtered = propsData.filter(p => {
    const matchesSearch =
      !search ||
      [p.id, p.title, p.user_name, p.number_of_bedrooms]
        .some(f => String(f).toLowerCase().includes(search.toLowerCase()));
    const matchesBeds   = !bedFilter || p.number_of_bedrooms === Number(bedFilter);
    const matchesDate   = !dateFilter || p.created_at.startsWith(dateFilter);
    return matchesSearch && matchesBeds && matchesDate;
  });

  const deleteOne = async id => {
    try {
      const res = await axios.delete(`https://api.linknamali.ke/admin/delete-property/${id}`);
      if (res.status === 200) {
        setPropsData(pd => pd.filter(x => x.id !== id));
        setAllProps(ap => ap.filter(x => x.id !== id));
        toast.success('✅ Deletion successful'); // Using toast for success
      }
    } catch {
      toast.error('❌ Deletion failed'); // Using toast for error
    }
    setModalOpen(false);
  };

  const handleLinkToAgent = async item => {
    if (!selectedAgent) {
      toast.error('No agent chosen – please select an agent first!');
      return;
    }
    try {
      const res = await axios.post(
        `https://api.linknamali.ke/linkagent/${item.property_type}/${item.id}`,
        { agent_id: selectedAgent.id }
      );
      localStorage.removeItem('selectedAgent');
      setSelectedAgent(null);
      // update this listing in-memory so status updates immediately
      setAllProps(ap => ap.map(p =>
        p.id === item.id ? { ...p, verified_by_agent_id: selectedAgent.id } : p
      ));
      setPropsData(pd => pd.map(p =>
        p.id === item.id ? { ...p, verified_by_agent_id: selectedAgent.id } : p
      ));
      toast.success(res.data.message); // Using toast for success
    } catch {
      localStorage.removeItem('selectedAgent');
      setSelectedAgent(null);
      toast.error('❌ Linking failed'); // Using toast for error
    }
  };

  // --- New unlink logic ---
  const handleUnlinkFromAgent = async item => {
    try {
      const res = await axios.delete(
        `https://api.linknamali.ke/unlinkagent/${item.property_type}/${item.id}`,
        { data: { agent_id: item.verified_by_agent_id } }
      );
      // clear agent in-memory
      setAllProps(ap => ap.map(p =>
        p.id === item.id ? { ...p, verified_by_agent_id: null } : p
      ));
      setPropsData(pd => pd.map(p =>
        p.id === item.id ? { ...p, verified_by_agent_id: null } : p
      ));
      toast.success(res.data.message || '✅ Unlinked successfully'); // Using toast for success
    } catch (err) {
      toast.error('❌ Unlink failed'); // Using toast for error
    }
  };
  // --- end unlink logic ---

  const openModal = id => { setToDeleteId(id); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setToDeleteId(null); };

  return (
    <div style={styles.container(open)}>
      <Header onSidebarToggle={() => setOpen(o => !o)} />
      <AdminSidebar isOpen={open} />
{/* ← Back to Dashboard button */}
      <div style={{ margin: '20px', marginLeft: open ? 270 : 20 }}>
        <button
         onClick={() => navigate('/admin-dashboard')}
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: '#fff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
       >
          ← Back to Dashboard
       </button>
      </div>
      {open && <div style={styles.overlay} onClick={() => setOpen(false)} />}
      <ToastContainer position="top-right" autoClose={5000} />
      <div style={styles.welcome}>
        <Link to="/admin-dashboard/AdminNewListings" style={styles.newBtn}>
          New Listings
        </Link>
      </div>

      <div style={styles.cards}>
        {Object.entries(counts).map(([k,v])=>(
          <div key={k} style={styles.card(SECONDARY_COLOR)} onClick={()=>selectType(k)}>
            <h3>{k.charAt(0).toUpperCase()+k.slice(1)}</h3>
            <p style={{fontSize:'2.1rem'}}>{v}</p>
          </div>
        ))}
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search ID, Title, User, Bedrooms"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        <input
          style={styles.input}
          type="date"
          placeholder="Created At"
          value={dateFilter}
          onChange={e=>setDateFilter(e.target.value)}
        />
      </div>

      <div style={styles.tableWrap}>
        {loading ? <p>Loading...</p> : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Actions</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const linkedName = item.verified_by_agent_id
                  ? agentsMap[item.verified_by_agent_id]
                  : null;
                return (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td style={styles.td}>{item.id}</td>
                      <td style={styles.td}>{item.title}</td>
                      <td style={styles.td}>{item.user_name}</td>
                      <td style={styles.td}>
                        <button style={styles.iconBtn} onClick={()=>setExpanded(expanded===item.id?null:item.id)}>
                          <Eye size={20} color={PRIMARY_COLOR}/>
                        </button>
                        <button style={styles.iconBtn} onClick={()=>openModal(item.id)}>
                          <Trash2 size={20} color="#ff4444"/>
                        </button>
                        {/* Using the correct Link icon from lucide-react */}
                        <button style={styles.iconBtn} onClick={()=>handleLinkToAgent(item)}>
                          <Link size={20} color={PRIMARY_COLOR}/> 
                        </button>
                        {linkedName && (
                          // Using X icon for unlinking, you can choose another if preferred
                          <button style={styles.iconBtn} onClick={()=>handleUnlinkFromAgent(item)}>
                            <X size={20} color={SECONDARY_COLOR}/>
                          </button>
                        )}
                      </td>
                      <td style={styles.td}>
                        {linkedName
                          ? `🔒 Linked to ${linkedName}`
                          : <span style={{color: SECONDARY_COLOR}}>Not linked</span>
                        }
                      </td>
                    </tr>
                    {expanded===item.id && (
                      <tr>
                        <td colSpan={5}>
                          <div style={styles.detailCard}>
                            <h3 style={styles.detailTitle}>{item.title} Details</h3>
                            {[
                              ['Description', item.description],
                              ['Bedrooms', item.number_of_bedrooms],
                              ['Bathrooms', item.number_of_bathrooms],
                              ['Amenities', item.amenities],
                              ['Location', item.location],
                              ['Town', item.town],
                              ['Price', item.price],
                              ['Size', item.size || item.land_size],
                              ['Type', item.property_type],
                              ['Purpose', item.purpose],
                              ['Availability', item.availability_status],
                              ['Created At', item.created_at],
                              ['Approved', item.is_approved],
                            ].map(([label,val])=>(
                              <div key={label} style={styles.detailRow}>
                                <strong>{label}:</strong> {val ?? 'N/A'}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <AlertCircle size={48} style={styles.modalIcon}/>
            <div style={styles.modalText}>Are you sure? This action cannot be undone.</div>
            <div style={styles.btnGroup}>
              <button style={styles.btnCancel} onClick={closeModal}>Cancel</button>
              <button style={styles.btnConfirm} onClick={()=>deleteOne(toDeleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;