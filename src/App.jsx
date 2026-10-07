import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { api } from './api'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import './App.css'
import { I } from './icons'

const WelcomeOperating = lazy(() => import('./WelcomeOperating'))
const MasterCard = lazy(() => import('./MasterCard'))
const DailyWorkReport = lazy(() => import('./DailyWorkReport'))
const UnitRegistration = lazy(() => import('./UnitRegistration'))
const Companies = lazy(() => import('./Companies'))
const Technicians = lazy(() => import('./Technicians'))
const Clients = lazy(() => import('./Clients'))
const Foremen = lazy(() => import('./Foremen'))
const Dashboard = lazy(() => import('./Dashboard'))
const Register = lazy(() => import('./Register'))
const Login = lazy(() => import('./Login'))
const MyProfile = lazy(() => import('./MyProfile'))
const Payments = lazy(() => import('./Payments'))


/* ════ NAV ════ */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: I.dashboard },
  { id: 'welcome', label: 'Welcome Operating Room', icon: I.welcome },
  { id: 'mastercard', label: 'Master Card', icon: I.card },
  { id: 'unit', label: 'Unit Registration', icon: I.unit },
  { id: 'report', label: 'Daily Work Report', icon: I.report },
  { id: 'companies', label: 'Companies', icon: I.companies },
  { id: 'technicians', label: 'Technicians', icon: I.tech },
  { id: 'foremen', label: 'Foremen', icon: I.users },
  { id: 'clients', label: 'Clients', icon: I.clients },
  { id: 'payments', label: 'Payments', icon: I.card },
]

/* ════ NOTIFICATIONS ════ */
const NOTIFS = []

function getCurrentUserFromStorage() {
  try {
    let raw = sessionStorage.getItem('user')
    if (!raw) {
      raw = sessionStorage.getItem('company')
    }
    const user = raw ? JSON.parse(raw) : {}
    const normalizedRole = (user.role ?? user.Role ?? 'Admin')?.toString()?.trim() || 'Admin'
    return {
      ...user,
      fullName: user.fullName ?? user.FullName ?? user.companyName ?? user.CompanyName ?? user.name ?? 'User',
      email: user.email ?? user.Email ?? '',
      role: normalizedRole,
      Role: normalizedRole,
    }
  } catch {
    return { role: 'Admin', Role: 'Admin', fullName: 'User', email: '' }
  }
}

function getProfileImage() {
  try {
    return sessionStorage.getItem('profileImage') || localStorage.getItem('company_logo') || ''
  } catch {
    return ''
  }
}

/* ════════════════════════
   CHART COMPONENTS
════════════════════════ */

function Sparkline({ color = '#0D4F3C', pts = [3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10] }) {
  const W = 110, H = 28, mn = Math.min(...pts), mx = Math.max(...pts)
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - ((v - mn) / (mx - mn || 1)) * (H - 4) - 2}`).join(' ')
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 28, display: 'block' }}>
    <polyline points={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function BarChart() {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const vals = [50, 68, 100, 60, 47, 57]
  const mx = 100, BW = 28, GAP = 18, maxH = 130, padL = 6, padB = 16
  const totalW = labels.length * (BW + GAP) - GAP
  return <svg viewBox={`0 0 ${totalW + padL * 2} ${maxH + padB}`} style={{ width: '100%', height: '100%', display: 'block' }}>
    {vals.map((v, i) => {
      const bh = (v / mx) * maxH, x = padL + i * (BW + GAP), y = maxH - bh, isM = v === mx
      return <g key={i}>
        <rect x={x} y={y} width={BW} height={bh} rx="2"
          fill={isM ? '#0D4F3C' : '#e2e8f0'}
          style={{ cursor: 'poPoppins', transition: 'opacity .15s' }}
          onMouseEnter={e => e.target.style.opacity = .75}
          onMouseLeave={e => e.target.style.opacity = 1} />
        <text x={x + BW / 2} y={maxH + padB - 2} textAnchor="middle" fontSize="10.5"
          fill={isM ? '#002147' : '#64748b'} fontWeight={isM ? '800' : '600'} fontFamily="Poppins,sans-serif">{labels[i]}</text>
      </g>
    })}
  </svg>
}

function DonutChart({ data, total }) {
  const cx = 78, cy = 70, R = 66
  let start = -90
  const slices = data.map(d => {
    const ang = (d.pct / 100) * 360, end = start + ang, lg = ang > 180 ? 1 : 0
    const ra = a => (a * Math.PI) / 180
    const x1 = cx + R * Math.cos(ra(start)), y1 = cy + R * Math.sin(ra(start))
    const x2 = cx + R * Math.cos(ra(end)), y2 = cy + R * Math.sin(ra(end))
    const mid = start + ang / 2, lR = R * 0.72
    const lx = cx + lR * Math.cos(ra(mid)), ly = cy + lR * Math.sin(ra(mid))
    const pth = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} Z`
    start = end
    return { ...d, pth, lx, ly }
  })
  return <svg viewBox="0 0 156 140" style={{ width: 140, height: 140, flexShrink: 0 }}>
    {slices.map((s, i) => (
      <path key={i} d={s.pth} fill={s.color} stroke="#fff" strokeWidth="2.5"
        style={{ cursor: 'poPoppins', transition: 'opacity .15s' }}
        onMouseEnter={e => e.target.style.opacity = .82}
        onMouseLeave={e => e.target.style.opacity = 1} />
    ))}
    {slices.map((s, i) => s.pct >= 7 && (
      <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
        fontSize="11.5" fill="white" fontWeight="700" fontFamily="Poppins,sans-serif">{s.pct}%</text>
    ))}
  </svg>
}

function TechGauge({ value = 82 }) {
  const cx = 65, cy = 65, r = 52, circ = 2 * Math.PI * r, filled = (value / 100) * circ
  return <svg viewBox="0 0 130 130" style={{ width: 130, height: 130, display: 'block' }}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e4f0ec" strokeWidth="14" strokeLinecap="round" />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0D4F3C" strokeWidth="14" strokeLinecap="round"
      strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ * 0.25}
      style={{ transition: 'stroke-dasharray 1s ease' }} />
    <text x={cx} y={cy - 7} textAnchor="middle" fontSize="22" fontWeight="800"
      fill="#002147" fontFamily="Poppins,sans-serif">{value}%</text>
    <text x={cx} y={cy + 11} textAnchor="middle" fontSize="10"
      fill="#94a3b8" fontFamily="Poppins,sans-serif">On Duty</text>
  </svg>
}
const createClusterIcon = (color, number) => L.divIcon({
  className: 'custom-map-bubble',
  html: `<div style="background: ${color}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2px solid #fff;">${number}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

function PakistanMap() {
  const mapCenter = [30.3753, 69.3451]; // Pakistan general center

  const CITIES = [
    { name: 'Karachi', pos: [24.8609, 67.0104], color: '#0D4F3C', val: '15' },   // Green
    { name: 'Quetta', pos: [30.1911, 67.0075], color: '#DC2626', val: '3' },     // Red
    { name: 'Multan', pos: [30.1956, 71.4753], color: '#0D4F3C', val: '6' },     // Green
    { name: 'Lahore', pos: [31.5497, 74.3436], color: '#F97316', val: '12' },    // Orange
    { name: 'Islamabad', pos: [33.6938, 73.0651], color: '#0D4F3C', val: '8' },  // Green
  ];

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={5}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#fafaf9' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        {/* Render Poppinsactive city markers strictly based on user instructions */}
        {CITIES.map((c, i) => (
          <Marker
            key={i}
            position={c.pos}
            icon={createClusterIcon(c.color, c.val)}
          />
        ))}

        {/* Place Native Leaflet Zoom Controls vertically at bottom right */}
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}

/* ════ HOOKS ════ */
function useDD() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return { open, setOpen, ref }
}

function Sidebar({ onNavClick, sbOpen, setSbOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null') || {}
    } catch {
      return {}
    }
  })()
  const active = NAV.find(item => {
    if (item.id === 'dashboard') return location.pathname === '/'
    return location.pathname.toLowerCase().includes(item.id)
  })?.id || 'dashboard'

  const handleNav = (item) => {
    onNavClick?.()
    navigate(item.id === 'dashboard' ? '/Dashboard' : `/${item.id}`)
  }

  return (
    <>
      <aside className={`sidebar ${sbOpen ? 'open' : ''}`}>
        <button className="sb-mobile-close" onClick={() => setSbOpen(false)}>{I.close}</button>
        <div className="sb-logo">
          <div style={{ width: 35, height: 35, borderRadius: 12, background: '#fff', color: '#002147', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
            SPM
          </div>
          <div>
            <div className="sb-t1">SMART PROMAN</div>
            <div className="sb-t2">Operations Suite</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sb-item ${active === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item)}
            >
              <span className="sb-ico">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="sb-item sb-logout" onClick={() => {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('company')
          sessionStorage.removeItem('dashboardCompany')
          window.dispatchEvent(new Event('auth-changed'))
          navigate('/login', { replace: true })
        }}>
          <span className="sb-ico">{I.signout}</span>
          Sign Out
        </button>

        <div className="sb-hex">
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.08)' }} />
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.06)' }} />
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.05)' }} />
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.07)' }} />
        </div>
      </aside>
      {sbOpen && <div className="sb-overlay" onClick={() => setSbOpen(false)}></div>}
    </>
  )
}

function Header({
  title,
  filtered,
  selectedCompanyName,
  onClearFilter,
  unreadCount,
  onNotifClick,
  notifRef,
  notifPanel,
  onProfileClick,
  profileRef,
  profilePanel,
  onMenuClick,
  currentUser,
  profileImage
}) {

  return (
    <header className="topbar">
      <div className="tb-l-wrap">
        <button className="menu-btn" onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div>
          <div className="page-title">{title}</div>
          {filtered && (
            <div className="page-filter-pill">
              <span>Showing: {selectedCompanyName}</span>
              <button type="button" onClick={onClearFilter}>Clear</button>
            </div>
          )}
        </div>
      </div>
      <div className="tb-r">
        <div className="dd-wrap" ref={notifRef}>
          <button className="icon-btn" onClick={onNotifClick} type="button">
            {I.bell}
            {unreadCount > 0 && <span className="nbadge">{unreadCount}</span>}
          </button>
          {notifPanel}
        </div>

        <div className="dd-wrap" ref={profileRef}>
          <button className="prof-btn" onClick={onProfileClick} type="button">
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {profileImage ? (
                <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0D4F3C', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="prof-info">
              <div className="pname">{currentUser.fullName || 'User'}</div>
              <div className="prole">{(currentUser.role || 'Staff').toUpperCase()}</div>
            </div>
            <span className="pchev">{I.chevron}</span>
          </button>
          {profilePanel}
        </div>
      </div>
    </header>
  )
}

/* ════════════════════════════════════════
   TOTAL JOBS MODAL
════════════════════════════════════════ */
function TotalJobsModal({ onClose, onSelectCompany }) {
  const [tab, setTab] = useState('companies')
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState([])
  const [foremen, setForemen] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [cRes, fRes] = await Promise.all([
          api.getCompanies().catch(() => null),
          api.getTechnicians().catch(() => null)
        ])
        setCompanies((Array.isArray(cRes) ? cRes : []).map(company => ({
          id: company.companyID ?? company.companyId ?? company.id,
          name: company.companyName ?? company.CompanyName ?? company.name ?? 'Unknown Company',
          incharge: company.inchargeName ?? company.InchargeName ?? company.incharge ?? '--',
          city: [company.city ?? company.City, company.zone ?? company.Zone].filter(Boolean).join(' / ') || '--',
          jobs: company.jobsCompleted ?? company.totalJobs ?? company.jobs ?? 0,
          rev: company.revenue !== undefined ? `PKR ${company.revenue.toLocaleString()}` : (company.totalRevenue ?? 'PKR 0'),
        })))
        setForemen((Array.isArray(fRes) ? fRes : [])
          .filter(foreman => (foreman.designation ?? foreman.Designation) === 'Foreman')
          .map(foreman => ({
            id: foreman.technicianID ?? foreman.TechnicianID,
            name: foreman.fullName ?? foreman.FullName ?? 'Unknown Foreman',
            jobs: foreman.totalJobsSolved ?? foreman.TotalJobsSolved ?? foreman.jobs ?? 0,
            rev: foreman.revenue ?? foreman.totalRevenue ?? 'PKR 0',
            status: (foreman.approvalStatus ?? foreman.ApprovalStatus) === 'Suspended' ? 'Suspended' : 'Active',
          })))
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const filteredCompanies = companies.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.incharge || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  )
  const filteredForemen = foremen.filter(f =>
    (f.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Total Jobs — Drill-Down View</div>
            <div className="modal-sub">Click a company row to filter the entire dashboard</div>
          </div>
          <button className="modal-close" onClick={onClose}>{I.close}</button>
        </div>

        {/* Search Bar */}
        <div className="modal-search">
          <span className="ms-ico">{I.search}</span>
          <input
            className="ms-inp"
            placeholder={tab === 'companies' ? 'Search by company, incharge, or city…' : 'Search foreman name…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && <button className="ms-clear" onClick={() => setSearch('')}>{I.close}</button>}
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`mtab ${tab === 'companies' ? 'active' : ''}`} onClick={() => { setTab('companies'); setSearch('') }}>
            {I.building}&nbsp; Companies
            <span className="mtab-badge">{companies.length}</span>
          </button>
          <button className={`mtab ${tab === 'foremen' ? 'active' : ''}`} onClick={() => { setTab('foremen'); setSearch('') }}>
            {I.users}&nbsp; Foremen
            <span className="mtab-badge">{foremen.length}</span>
          </button>
        </div>

        {/* Grid */}
        <div className="modal-body">
          {tab === 'companies' && (
            <table className="modal-tbl">
              <thead>
                <tr>
                  <th>COMPANY ID</th>
                  <th>COMPANY NAME</th>
                  <th>ASSIGNED INCHARGE</th>
                  <th>CITY / ZONE</th>
                  <th>TOTAL JOBS</th>
                  <th>REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0
                  ? <tr><td colSpan="6" className="no-data">No companies found for "{search}"</td></tr>
                  : filteredCompanies.map(c => (
                    <tr key={c.id} className="modal-row"
                      onClick={() => { onSelectCompany(c); onClose() }}>
                      <td><span className="cid-badge">{c.id}</span></td>
                      <td className="cname">{c.name}</td>
                      <td className="cincharge">{c.incharge}</td>
                      <td>
                        <span className="city-tag">
                          <span className="city-ico">{I.mapPin}</span>{c.city}
                        </span>
                      </td>
                      <td><span className="jobs-num">{c.jobs}</span></td>
                      <td className="rev-cell">{c.rev}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {tab === 'foremen' && (
            <table className="modal-tbl">
              <thead>
                <tr>
                  <th>FOREMAN NAME</th>
                  <th>TOTAL JOBS</th>
                  <th>ACCUMULATED REVENUE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredForemen.length === 0
                  ? <tr><td colSpan="4" className="no-data">No foremen found for "{search}"</td></tr>
                  : filteredForemen.map((f, i) => (
                    <tr key={i} className="modal-row">
                      <td>
                        <div className="f-name-cell">
                          <div className="f-av" style={{ background: ['#0D4F3C', '#87CEEB', '#F97316', '#002147', '#DC2626', '#C0C0C0'][i % 6] }}>
                            {f.name.split(' ').map(w => w[0]).join('')}
                          </div>
                          <span className="cname">{f.name}</span>
                        </div>
                      </td>
                      <td><span className="jobs-num">{f.jobs}</span></td>
                      <td className="rev-cell">{f.rev}</td>
                      <td>
                        <span className={`fstatus ${f.status === 'Active' ? 'f-active' : 'f-leave'}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   APP
════════════════════════════════════════ */
const readStoredToken = () => sessionStorage.getItem('token') || ''

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname.toLowerCase()

  const token = sessionStorage.getItem('token') || ''

  const [showModal, setShowModal] = useState(false)
  const [selectedCompany, setSelected] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('dashboardCompany') || 'null')
    } catch {
      return null
    }
  })
  const [readIds, setReadIds] = useState([])
  const [dotOpen, setDotOpen] = useState(null)
  const [sbOpen, setSbOpen] = useState(false)
  // ── Dynamic notifications from API ────────────────────────────────────────
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  
  const [currentUser, setCurrentUser] = useState(getCurrentUserFromStorage())
  const [profileImage, setProfileImage] = useState(getProfileImage())
  
  const notifDD = useDD()
  const profileDD = useDD()

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(getCurrentUserFromStorage())
      setProfileImage(getProfileImage())
    }
    window.addEventListener('profile-updated', handleUpdate)
    return () => window.removeEventListener('profile-updated', handleUpdate)
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) return

    api.getCurrentUserProfile()
      .then((response) => {
        const user = response?.company || response?.user || response
        if (!user) return

        const nextUser = {
          userID: user.userID ?? user.UserID ?? user.id ?? user.Id ?? null,
          fullName: user.inchargeName ?? user.InchargeName ?? user.fullName ?? user.FullName ?? user.name ?? user.Name ?? '',
          email: user.email ?? user.Email ?? '',
          role: (user.role ?? user.Role ?? 'Admin')?.toString()?.trim() || 'Admin',
        }

        sessionStorage.setItem('user', JSON.stringify(nextUser))
        
        if (user.companyLogo || user.CompanyLogo) {
          sessionStorage.setItem('profileImage', user.companyLogo || user.CompanyLogo)
        }
        window.dispatchEvent(new Event('profile-updated'))
      })
      .catch(() => {
        // keep existing sessionStorage fallback if profile fetch fails
      })
  }, [])

  const isAuthPage = path === '/login' || path === '/register'

  let activeNav = 'dashboard';
  if (location.pathname.toLowerCase().includes('welcome')) activeNav = 'welcome';
  else if (location.pathname.toLowerCase().includes('mastercard')) activeNav = 'mastercard';
  else if (location.pathname.toLowerCase().includes('unit')) activeNav = 'unit';
  else if (location.pathname.toLowerCase().includes('report')) activeNav = 'report';
  else if (location.pathname.toLowerCase().includes('companies')) activeNav = 'companies';
  else if (location.pathname.toLowerCase().includes('technicians')) activeNav = 'technicians';
  else if (location.pathname.toLowerCase().includes('foremen')) activeNav = 'foremen';
  else if (location.pathname.toLowerCase().includes('clients')) activeNav = 'clients';
  else if (location.pathname.toLowerCase().includes('payments')) activeNav = 'payments';

  const pageTitle = activeNav === 'welcome' ? 'Welcome Operating' :
    activeNav === 'mastercard' ? 'Master Card' :
      activeNav === 'unit' ? 'Unit Registration' :
        activeNav === 'report' ? 'Daily Work Report' :
          activeNav === 'companies' ? 'Companies Control Center' :
            activeNav === 'technicians' ? 'Technician Control Center' :
              activeNav === 'foremen' ? 'Foremen Control Center' :
                activeNav === 'clients' ? 'Client Overview' :
                  activeNav === 'payments' ? 'Payment Overview' :
                    'Dashboard Overview';

  const API_BASE = 'https://webapicoderepo.onrender.com'

  // Load notifications on mount and every 30s
  useEffect(() => {
    loadNotifications()
    const t = setInterval(loadNotifications, 30000)
    return () => clearInterval(t)
  }, [])

  // Also reload when notification panel opens
  useEffect(() => {
    if (notifDD.open) loadNotifications()
  }, [notifDD.open])

  const loadNotifications = async () => {
    setNotifLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/AdminNotifications`)
      if (r.ok) {
        const d = await r.json()
        setNotifications(d.notifications || [])
      }
    } catch (_) { }
    setNotifLoading(false)
  }

  const markRead = async (id, type) => {
    setReadIds(p => [...p, id])
    try { await fetch(`${API_BASE}/api/AdminNotifications/${id}/read`, { method: 'POST' }) } catch (_) { }
    
    // Routing based on notification type
    if (type === 'company_registered') {
      notifDD.setOpen(false);
      navigate('/companies');
    }
  }

  const markAllRead = async () => {
    // We didn't implement a read-all endpoint for admin notifications, 
    // but we can loop through them or just ignore for now.
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    setReadIds(p => [...p, ...unreadIds])
    unreadIds.forEach(id => {
      fetch(`${API_BASE}/api/AdminNotifications/${id}/read`, { method: 'POST' }).catch(() => {})
    })
  }

  const unread = notifications.filter(n => !n.isRead && !readIds.includes(n.id)).length

  const dotColor = (type) => {
    if (type === 'delay') return '#F97316'
    if (type === 'stuck') return '#DC2626'
    if (type === 'info') return '#0D4F3C'
    return '#64748b'
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  // When company is selected → filter KPIs
  const selectCompany = (company) => {
    setSelected(company)
    sessionStorage.setItem('dashboardCompany', JSON.stringify(company))
  }

  const clearCompany = () => {
    setSelected(null)
    sessionStorage.removeItem('dashboardCompany')
  }

  const filtered = !!selectedCompany
  const filteredJobs = []

  return (
    <div className="app">

      {/* ════ TOTAL JOBS MODAL ════ */}
      {showModal && !isAuthPage && (
        <TotalJobsModal
          onClose={() => setShowModal(false)}
          onSelectCompany={(c) => { selectCompany(c); setShowModal(false) }}
        />
      )}

      {/* ════ SIDEBAR ════ */}
      {!isAuthPage && (
        <Sidebar onNavClick={() => setSbOpen(false)} sbOpen={sbOpen} setSbOpen={setSbOpen} />
      )}

      {/* ════ MAIN ════ */}
      <main className="main" style={isAuthPage ? { padding: 0 } : {}}>

        {/* ── TOPBAR ── */}
        {!isAuthPage && (
          <Header
          title={pageTitle}
          onMenuClick={() => setSbOpen(true)}
          currentUser={currentUser}
          profileImage={profileImage}
          filtered={filtered}
          selectedCompanyName={selectedCompany?.name}
          onClearFilter={clearCompany}
          unreadCount={unread}
          onNotifClick={() => notifDD.setOpen(o => !o)}
          notifRef={notifDD.ref}
          notifPanel={
            notifDD.open && (
              <div className="dd-panel notif-dd">
                <div className="dd-hd">
                  <span className="dd-title">Notifications {unread > 0 && <span className="nbadge" style={{ position: 'static', marginLeft: 6, fontSize: 11 }}>{unread}</span>}</span>
                  <button className="dd-lnk" onClick={markAllRead}>Mark all read</button>
                </div>
                <div className="notif-list">
                  {notifLoading && notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>Loading...</div>
                  ) : notifications.filter(n => !n.isRead && !readIds.includes(n.id)).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>No notifications yet</div>
                  ) : notifications.filter(n => !n.isRead && !readIds.includes(n.id)).map(n => {
                    return (
                      <div key={n.id} className="nitem"
                        onClick={() => markRead(n.id, n.type)}>
                        <span className="ndot" style={{ background: dotColor(n.type) }} />
                        <div className="nbody">
                          <div className="ntitle">{n.title}</div>
                          <div className="nmsg" style={{ whiteSpace: 'pre-line', fontSize: 12 }}>{n.message}</div>
                          <div className="ntime">{timeAgo(n.date)}</div>
                        </div>
                        <span className="npip" />
                      </div>
                    )
                  })}
                </div>
                <div className="dd-ft">
                  <button className="dd-lnk" onClick={loadNotifications}>↻ Refresh</button>
                </div>
              </div>
            )
          }
          onProfileClick={() => profileDD.setOpen(o => !o)}
          profileRef={profileDD.ref}
          profilePanel={
            profileDD.open && (
              <div className="dd-panel prof-dd">
                <div className="prof-hdr">
                  {profileImage ? (
                    <img src={profileImage} alt="profile" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#002147', color: '#87CEEB', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="ph-name">{currentUser.fullName || 'User'}</div>
                    <div className="ph-mail">{currentUser.email || 'user@smartproman.com'}</div>
                    <span className="ph-badge">{(currentUser.role || 'STAFF').toUpperCase()}</span>
                  </div>
                </div>
                <div className="dd-sep" />
                {[{ ico: I.userIco, lbl: 'My Profile', path: '/profile' }].map((x, i) => (
                  <button key={i} className="pd-row" onClick={() => {
                    profileDD.setOpen(false)
                    if (x.path) navigate(x.path)
                  }}>
                    <span className="pd-ico">{x.ico}</span>{x.lbl}
                  </button>
                ))}
                <div className="dd-sep" />
                <button className="pd-row pd-out" onClick={() => {
                  profileDD.setOpen(false)
                  sessionStorage.removeItem('token')
                  sessionStorage.removeItem('company')
                  sessionStorage.removeItem('dashboardCompany')
                  window.dispatchEvent(new Event('auth-changed'))
                  navigate('/login', { replace: true })
                }}>
                  <span className="pd-ico">{I.signout}</span>Sign Out
                </button>
              </div>
            )
          }
        />
        )}

        {/* ──────── MAIN CONTENT ──────── */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', color: '#0D4F3C', fontSize: '18px', fontWeight: '600' }}>Loading Page...</div>}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={token ? <Navigate to="/Dashboard" replace /> : <Login />} />
              <Route path="/register" element={token ? <Navigate to="/Dashboard" replace /> : <Register />} />

              {/* Protected Routes */}
              <Route path="/WelcomeOperating" element={!token ? <Navigate to="/login" replace /> : <WelcomeOperating />} />
              <Route path="/welcome" element={!token ? <Navigate to="/login" replace /> : <WelcomeOperating />} />
              <Route path="/mastercard" element={!token ? <Navigate to="/login" replace /> : <MasterCard />} />
              <Route path="/unit" element={!token ? <Navigate to="/login" replace /> : <UnitRegistration />} />
              <Route path="/report" element={!token ? <Navigate to="/login" replace /> : <DailyWorkReport />} />
              <Route path="/companies" element={!token ? <Navigate to="/login" replace /> : <Companies />} />
              <Route path="/technicians" element={!token ? <Navigate to="/login" replace /> : <Technicians />} />
              <Route path="/foremen" element={!token ? <Navigate to="/login" replace /> : <Foremen />} />
              <Route path="/clients" element={!token ? <Navigate to="/login" replace /> : <Clients />} />
              <Route path="/payments" element={!token ? <Navigate to="/login" replace /> : <Payments />} />
              <Route path="/profile" element={!token ? <Navigate to="/login" replace /> : <MyProfile />} />
              <Route path="/Dashboard" element={!token ? <Navigate to="/login" replace /> : <Dashboard selectedCompany={selectedCompany} filteredJobs={filteredJobs} onOpenModal={() => setShowModal(true)} onClearFilter={clearCompany} />} />
              
              <Route path="/" element={<Navigate to={token ? '/Dashboard' : '/login'} replace />} />
              <Route path="*" element={<Navigate to={token ? '/Dashboard' : '/login'} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      {dotOpen && <div className="overlay" onClick={() => setDotOpen(null)} />}
    </div>
  )
}
