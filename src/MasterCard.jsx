import React, { useState, useEffect } from 'react'
import { api } from './api'
import './MasterCard.css'
import companyDefaultImg from './assets/company_default.jpg'

/* ── SVG Icons ── */
const UI = {
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  clip: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>,
  helmet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 0 0-9 9v2c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-2a9 9 0 0 0-9-9z" /><path d="M2.5 13h19" /><path d="M12 13v6" /><path d="M8 19h8" /></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  checkList: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  arrowR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  print: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
}

/* ── Tracker step definitions ── */
const TRACKER_STEPS = [
  { k: 1, lbl: 'Assigned', t: '10:00 AM', ico: UI.user },
  { k: 2, lbl: 'On Way', t: '10:10 AM', ico: UI.truck },
  { k: 3, lbl: 'Unit Registration', t: '10:15 AM', ico: UI.checkList },
  { k: 4, lbl: 'Pro Forma', t: '10:24 AM', ico: UI.file },
  { k: 5, lbl: 'Payment Collection', t: '11:00 AM', ico: UI.file },
  { k: 6, lbl: 'Job Closure', t: '11:40 AM', ico: UI.clock },
]

function normalizeTrackerStep(step) {
  const value = String(step || '').trim().toLowerCase();
  if (!value) return 'Assigned';

  const map = {
    assigned: 'Assigned',
    jobassigned: 'Assigned',
    onway: 'OnWay',
    on_way: 'OnWay',
    'on way': 'OnWay',
    arrived: 'Arrived',
    registration: 'UnitRegistration',
    unitregistration: 'UnitRegistration',
    unit_registration: 'UnitRegistration',
    'unit registration': 'UnitRegistration',
    fir: 'ProForma',
    proforma: 'ProForma',
    'proforma done': 'ProForma',
    'fir / quote': 'ProForma',
    quote: 'ProForma',
    fcr: 'PaymentCollection',
    paymentcollected: 'PaymentCollection',
    payment_collected: 'PaymentCollection',
    paymentcollect: 'PaymentCollection',
    'payment collect': 'PaymentCollection',
    'payment collection': 'PaymentCollection',
    'job closure': 'JobClosure',
    closure: 'JobClosure',
    completed: 'JobClosure'
  };

  return map[value] || 'Assigned';
}

function deriveTrackerState(currentStep, fallbackStep = 'Assigned') {
  const rawStep = normalizeTrackerStep(currentStep || fallbackStep);
  const order = ['Assigned', 'OnWay', 'UnitRegistration', 'ProForma', 'PaymentCollection', 'JobClosure'];
  let index = order.indexOf(rawStep);

  if (rawStep === 'Arrived') {
    index = 2; // UnitRegistration
    return { currentStep: index + 1, label: 'Arrived', isActive: false, isAssigned: false };
  }
  if (rawStep === 'Assigned') {
    return { currentStep: 2, label: 'Assigned', isActive: false, isAssigned: true };
  }

  const safeIndex = index >= 0 ? index + 1 : 1;
  return { currentStep: safeIndex, label: order[(index >= 0 ? index : 0)], isActive: true, isAssigned: false };
}

const COLOR_THEMES = [
  { sColor: '#002147', c_client: '#6d28d9', c_company: '#ea580c', c_tech: '#ea580c', c_track: '#9f1239', c_prof: '#7e22ce' },
  { sColor: '#16a34a', c_client: '#16a34a', c_company: '#2563eb', c_tech: '#16a34a', c_track: '#64748b', c_prof: '#7e22ce' },
  { sColor: '#0ea5e9', c_client: '#ea580c', c_company: '#2563eb', c_tech: '#16a34a', c_track: '#64748b', c_prof: '#7e22ce' },
  { sColor: '#0ea5e9', c_client: '#1e3a8a', c_company: '#2563eb', c_tech: '#16a34a', c_track: '#1e3a8a', c_prof: '#7e22ce' },
  { sColor: '#16a34a', c_client: '#16a34a', c_company: '#16a34a', c_tech: '#16a34a', c_track: '#16a34a', c_prof: '#7e22ce' }
];

/* ── Tracker step renderer (shared between card & modal) ── */
function TrackerRow({ steps, realSteps, currentStep, isActive, isAssigned, status, jobColor }) {
  const displaySteps = realSteps?.length ? realSteps : steps
  const row1Fill = realSteps?.length
    ? (displaySteps.length > 1 ? (displaySteps.filter(s => s.completed).length / (displaySteps.length - 1)) * 100 : 0)
    : currentStep > steps[steps.length - 1].k
      ? 100
      : Math.max(0, ((currentStep - steps[0].k) / (steps.length - 1)) * 100)

  return (
    <div className="tracker-steps">
      <div className="ts-bg-line" />
      <div className="ts-fill-line" style={{ width: `${row1Fill}%`, background: jobColor }} />
      {displaySteps.map((s, index) => {
        const realStep = realSteps?.[index];
        const fallbackStep = steps[index]
        const isDone = realSteps?.length
          ? Boolean(realStep?.completed)
          : s.k < currentStep || (s.lbl === 'Job Closure' && status === 'Completed') || (isAssigned && s.k === 1);
        const isCurr = realSteps?.length
          ? Boolean(realStep?.active)
          : isActive && s.k === currentStep;
        
        // Animate the On Way step as long as it hasn't been completed.
        const isOnWay = String(s.label || s.lbl || '').toLowerCase().replace(/[\s_]/g, '') === 'onway';
        const shouldAnimate = isCurr && !isDone && isOnWay;

        return (
          <div key={s.key || s.k} className="t-step">
            <div className={`ts-circle ${isDone ? 'done' : isCurr ? 'active' : ''} ${shouldAnimate ? 'anim-zoom-on-way' : ''}`} style={isDone ? { width: 26, height: 26, background: '#16a34a', borderColor: '#16a34a', color: '#fff' } : isCurr ? { width: 26, height: 26, background: '#eab308', borderColor: '#eab308', color: '#fff' } : { width: 26, height: 26, borderColor: '#ef4444', color: '#fff', background: '#ef4444' }}>
              {isDone ? UI.check : (s.ico || fallbackStep?.ico || UI.clock)}
            </div>
            <div className="ts-lbl">{s.label || s.lbl}</div>
          </div>
        )
      })}
    </div>
  )
}


/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function MasterCard() {
  const [activeModal, setActiveModal] = useState(null)
  const [masterCards, setMasterCards] = useState([])
  const [trackerData, setTrackerData] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 6

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const response = await api.getMasterCards()

        if (!response || response.length === 0) {
          setMasterCards([])
          return
        }

        const mappedJobs = response.map((mc, i) => {
          const colors = COLOR_THEMES[i % COLOR_THEMES.length]
          const trackerState = deriveTrackerState(mc.currentStep || 'Assigned')
          return {
            ...colors,
            id: `MCID-00${mc.masterCardID || mc.jobID}`,
            jobId: mc.jobID,
            mcId: mc.masterCardID,
            status: mc.status || 'Assigned',
            created: mc.createdAt ? (function (d) { return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` })(new Date(mc.createdAt)) : '-',
            updated: mc.updatedAt ? new Date(mc.updatedAt).toLocaleTimeString() : '-',
            client: {
              id: `CRID-${mc.masterCardID || mc.jobID}`,
              name: mc.clientName || 'N/A',
              phone: mc.clientContact || mc.clientPhone || 'N/A',
              area: mc.clientArea || 'N/A',
              zone: mc.clientZone || 'N/A',
            },
            company: {
              title: mc.companyName || 'N/A',
              incharge: mc.companyIncharge || 'N/A',
              phone: mc.companyPhone || 'N/A',
              logo: mc.companyLogo || null
            },
            tech: {
              id: mc.technicianID ? `TECH-${String(mc.technicianID).padStart(3, '0')}` : 'N/A',
              name: mc.technicianName || 'Assigned',
              phone: mc.technicianPhone || 'N/A',
              photo: mc.technicianPhoto || null,
              status: [mc.technicianStatus || 'Assigned'],
            },
            serviceType: mc.serviceType || '',
            specialInstructions: mc.specialInstructions || '',
            tracker: {
              currentStep: trackerState.currentStep,
              isActive: trackerState.isActive,
              isAssigned: trackerState.isAssigned,
              eta: mc.trackerETA || 'Pending',
              cText: trackerState.label,
              timeUpdate: mc.updatedAt ? new Date(mc.updatedAt).toLocaleTimeString() : (mc.createdAt ? (function (d) { return d.toLocaleTimeString() })(new Date(mc.createdAt)) : 'N/A'),
            }
          }
        })
        // Always sort by jobId descending (newest at the top)
        mappedJobs.sort((a, b) => b.jobId - a.jobId)
        setMasterCards(mappedJobs)

        const trackerEntries = await Promise.all(mappedJobs.map(async (job) => {
          if (!job.jobId) return null
          try {
            const tracker = await api.getJobTracker(job.jobId)
            return [job.jobId, tracker]
          } catch (_) {
            return null
          }
        }))
        setTrackerData(Object.fromEntries(trackerEntries.filter(Boolean)))
      } catch (err) {
        console.error('API Error:', err)
        setMasterCards([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
    const refreshTimer = setInterval(loadData, 30000)
    return () => clearInterval(refreshTimer)
  }, [])

  const totalPages = Math.ceil(masterCards.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const displayJobs = masterCards.slice(indexOfFirstRecord, indexOfLastRecord);

  if (loading && masterCards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', backgroundColor: '#f8fafc' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#002147', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 16, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>Loading Master Cards...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!loading && masterCards.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', backgroundColor: '#f8fafc' }}>
        <div style={{ color: '#94a3b8', width: 64, height: 64, marginBottom: 16 }}>
          {UI.file}
        </div>
        <div style={{ color: '#475569', fontSize: 20, fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>No Master Cards Found</div>
        <div style={{ marginTop: 8, color: '#64748b', fontSize: 14, fontFamily: 'Poppins, sans-serif' }}>There are currently no master cards available in the system.</div>
      </div>
    );
  }

  return (
    <div className="mc-container">
      <style>{`
        @keyframes pulseZoom {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234,179,8,0.7); }
          50% { transform: scale(1.15); box-shadow: 0 0 10px 2px rgba(234,179,8,0.5); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234,179,8,0); }
        }
        @keyframes rippleWave {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .anim-zoom-on-way {
          position: relative;
          z-index: 1 !important;
          animation: pulseZoom 1.5s infinite ease-in-out !important;
          transform-origin: center center !important;
          transition: none !important;
        }
        .anim-zoom-on-way::after {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          border-radius: 50%;
          border: 2px solid #eab308;
          animation: rippleWave 1.5s infinite ease-out !important;
          z-index: -1 !important;
          pointer-events: none;
        }
      `}</style>
      {displayJobs.map((job) => (
        <div
          key={job.id}
          className="mc-job-entry"
          style={{ border: `2px solid ${job.sColor}`, background: `${job.sColor}40` }}
        >
          {/* ── Row Header ── */}
          <div className="mc-row-header">
            <div className="mcr-title">{job.id}</div>
            <div
              className="mcr-badge"
              style={{ color: job.sColor, background: job.sColor + '18', borderColor: job.sColor + '50' }}
            >
              <span className="mcr-dot" style={{ background: job.sColor }} />
              {job.status}
            </div>
            <div className="mcr-meta">
              <span className="mcr-meta-pill">Created At: <b>{job.created}</b></span>
              <span className="mcr-meta-pill">Last Updated: <b>{job.updated}</b></span>
            </div>
          </div>

          {/* ── Cards Grid ── */}
          <div className="mc-cards-grid">

            {/* 1. CLIENT */}
            <div
              className="mc-card mc-card-sm"
              style={{ borderColor: job.c_client, cursor: 'pointer' }}
              onClick={() => setActiveModal({ type: 'client', job })}
            >
              <div className="mcc-title-row" style={{ color: job.c_client }}>
                <span className="mcc-ico" style={{ color: job.c_client }}>{UI.user}</span>
                CLIENT INFORMATION
              </div>
              <div className="card-fields">
                <div className="cf-row"><span className="cf-lbl">CR ID</span><span className="cf-val">{job.client.id}</span></div>
                <div className="cf-row"><span className="cf-lbl">Client Name</span><span className="cf-val">{job.client.name}</span></div>
                <div className="cf-row"><span className="cf-lbl">Contact</span><span className="cf-val">{job.client.phone}</span></div>
                <div className="cf-row"><span className="cf-lbl">Area</span><span className="cf-val">{job.client.area}</span></div>
                <div className="cf-row"><span className="cf-lbl">Zone</span><span className="cf-val">{job.client.zone}</span></div>
              </div>
              <button className="mcc-link" style={{ color: job.c_client, background: job.c_client + '18' }}>
                View Client Details {UI.arrowR}
              </button>
            </div>

            {/* 2. COMPANY */}
            <div
              className="mc-card mc-card-sm"
              style={{ borderColor: job.c_company, cursor: 'pointer' }}
              onClick={() => setActiveModal({ type: 'company', job })}
            >
              <div className="mcc-title-row" style={{ color: job.c_company }}>
                <span className="mcc-ico" style={{ color: job.c_company }}>{UI.clip}</span>
                COMPANY INFORMATION
              </div>
              {/* Logo row */}
              <div className="co-logo-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                {job.company.logo ? (
                  <img src={job.company.logo} alt="Company Logo" className="tech-avatar" />
                ) : (
                  <img src={companyDefaultImg} alt="Company" className="tech-avatar" style={{ borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #e2e8f0' }} />
                )}
              </div>
              <div className="card-fields">
                <div className="cf-row"><span className="cf-lbl">Company Name</span><span className="cf-val">{job.company.title}</span></div>
                <div className="cf-row"><span className="cf-lbl">Incharge</span><span className="cf-val">{job.company.incharge}</span></div>
                <div className="cf-row"><span className="cf-lbl">Contact</span><span className="cf-val cf-bold">{job.company.phone}</span></div>
              </div>
              <button className="mcc-link" style={{ color: job.c_company, background: job.c_company + '18' }}>
                View Company Details {UI.arrowR}
              </button>
            </div>

            {/* 3. TECHNICIAN */}
            <div
              className="mc-card mc-card-md"
              style={{ borderColor: job.c_tech, cursor: 'pointer' }}
              onClick={() => setActiveModal({ type: 'tech', job })}
            >
              <div className="mcc-title-row" style={{ color: job.c_tech }}>
                <span className="mcc-ico" style={{ color: job.c_tech }}>{UI.helmet}</span>
                TECHNICIAN INFORMATION
              </div>
              {/* Photo + status row */}
              <div className="tech-head-row">
                {job.tech.photo ? (
                  <img src={job.tech.photo} alt="tech" className="tech-avatar" />
                ) : (
                  <div className="tech-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '65%', height: '65%' }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                  </div>
                )}
                <div className="tech-status">
                  <span className="tech-live">● Live</span>
                  <span className="tech-live">● On Site</span>
                </div>
              </div>
              <div className="card-fields">
                <div className="cf-row"><span className="cf-lbl">Tech ID</span><span className="cf-val">{job.tech.id}</span></div>
                <div className="cf-row"><span className="cf-lbl">Name</span><span className="cf-val">{job.tech.name}</span></div>
                <div className="cf-row"><span className="cf-lbl">Contact</span><span className="cf-val cf-bold">{job.tech.phone}</span></div>
              </div>
              <button className="mcc-link" style={{ color: job.c_tech, background: job.c_tech + '18' }}>
                View Technician Details {UI.arrowR}
              </button>
            </div>

            {/* 4. JOB TRACKER */}
            <div
              className="mc-card mc-card-lg"
              style={{ borderColor: job.c_track, cursor: 'pointer' }}
              onClick={() => setActiveModal({ type: 'tracker', job })}
            >
              <div className="mcc-title-row" style={{ color: job.c_track }}>
                <span className="mcc-ico" style={{ color: job.c_track }}>{UI.map}</span>
                JOB TRACKER
              </div>
              <div className="tracker-wrap">
                <TrackerRow steps={TRACKER_STEPS.slice(0, 3)} realSteps={trackerData[job.jobId]?.steps?.slice(0, 3)} currentStep={job.tracker.currentStep} isActive={job.tracker.isActive} isAssigned={job.tracker.isAssigned} status={job.status} jobColor={job.c_track} />
                <TrackerRow steps={TRACKER_STEPS.slice(3, 6)} realSteps={trackerData[job.jobId]?.steps?.slice(3, 6)} currentStep={job.tracker.currentStep} isActive={job.tracker.isActive} isAssigned={job.tracker.isAssigned} status={job.status} jobColor={job.c_track} />
                <div className="tracker-foot">
                  <div className="tf-blk">
                    <span className="tf-lbl">{UI.clock} ETA:</span>
                    <span className="tf-val">{job.tracker.eta}</span>
                  </div>
                  <div className="tf-blk">
                    <span className="tf-lbl">Step:</span>
                    <span className="tf-val">{job.tracker.cText}</span>
                  </div>
                  <div className="tf-blk">
                    <span className="tf-lbl">{UI.clock} Upd:</span>
                    <span className="tf-val">{job.tracker.timeUpdate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. PRO FORMA INVOICE (thumbnail) */}
            <ProFormaThumbnail job={job} onOpen={() => setActiveModal({ type: 'proforma', job })} />

          </div>
        </div>
      ))}

      {/* Paginator */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 20px', gap: 10, alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginRight: 'auto' }}>
            Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, masterCards.length)} of {masterCards.length} entries
          </span>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: currentPage === 1 ? '#94a3b8' : '#0f172a', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Poppins,sans-serif' }}>
            Previous
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{ width: 30, height: 30, borderRadius: 6, border: currentPage === i + 1 ? 'none' : '1px solid #cbd5e1', background: currentPage === i + 1 ? '#0D4F3C' : '#fff', color: currentPage === i + 1 ? '#fff' : '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins,sans-serif' }}>
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: currentPage === totalPages ? '#94a3b8' : '#0f172a', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Poppins,sans-serif' }}>
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === 'proforma' && (
        <ProFormaInvoiceModal job={activeModal.job} onClose={() => setActiveModal(null)} />
      )}
      {activeModal && activeModal.type !== 'proforma' && (
        <GenericModal onClose={() => setActiveModal(null)} modalData={activeModal} trackerData={trackerData} />
      )}
    </div>
  )
}

/* ════════════════════════════════════════
   GENERIC DETAIL MODAL
════════════════════════════════════════ */
function GenericModal({ onClose, modalData, trackerData }) {
  const { type, job } = modalData
  const titleMap = {
    client: { icon: UI.user, title: 'CLIENT INFORMATION', color: job.c_client },
    company: { icon: UI.clip, title: 'COMPANY INFORMATION', color: job.c_company },
    tech: { icon: UI.helmet, title: 'TECHNICIAN INFORMATION', color: job.c_tech },
    tracker: { icon: UI.map, title: 'JOB TRACKER', color: job.c_track },
    proforma: { icon: UI.file, title: 'PRO FORMA INVOICE', color: job.c_prof },
  }
  const cur = titleMap[type] || titleMap.client

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,33,71,0.6)', backdropFilter: 'blur(3px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        className="pf-modal"
        onClick={e => e.stopPropagation()}
        style={{ width: 460, maxWidth: '95vw', padding: 24, border: `2px solid ${cur.color}`, borderRadius: 10, maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.22s ease-out' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="mcc-title-row" style={{ color: cur.color, fontSize: 13, marginBottom: 0 }}>
            <span className="mcc-ico" style={{ color: cur.color }}>{cur.icon}</span>
            {cur.title}
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}
          >
            {UI.close}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {type === 'client' && <>
            <ModalRow lbl="Client ID" val={job.client.id} />
            <ModalRow lbl="Client Name" val={job.client.name} />
            <ModalRow lbl="Contact" val={job.client.phone} />
            <ModalRow lbl="Area" val={job.client.area} />
            <ModalRow lbl="Zone" val={job.client.zone} />
            <ModalRow lbl="Status" val={job.status} />
          </>}

          {type === 'company' && <>
            <div style={{ marginBottom: 8, paddingBottom: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
              {job.company.logo ? (
                <img src={job.company.logo} alt="Company Logo" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '50%', height: '50%' }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
                </div>
              )}
            </div>
            <ModalRow lbl="Company Name" val={job.company.title} />
            <ModalRow lbl="Incharge" val={job.company.incharge} />
            <ModalRow lbl="Contact" val={job.company.phone} bold />
          </>}

          {type === 'tech' && <>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 8, paddingBottom: 10, borderBottom: '1px solid #e2e8f0' }}>
              {job.tech.photo ? (
                <img src={job.tech.photo} alt="tech" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #cbd5e1' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '65%', height: '65%' }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>● Live Status</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>● On Site</div>
              </div>
            </div>
            <ModalRow lbl="Technician ID" val={job.tech.id} />
            <ModalRow lbl="Name" val={job.tech.name} />
            <ModalRow lbl="Contact" val={job.tech.phone} bold />
          </>}

          {type === 'tracker' && (
            <div className="tracker-modal">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
                <TrackerRow steps={TRACKER_STEPS.slice(0, 3)} realSteps={trackerData[job.jobId]?.steps?.slice(0, 3)} currentStep={job.tracker.currentStep} isActive={job.tracker.isActive} isAssigned={job.tracker.isAssigned} status={job.status} jobColor={job.c_track} />
                <TrackerRow steps={TRACKER_STEPS.slice(3, 6)} realSteps={trackerData[job.jobId]?.steps?.slice(3, 6)} currentStep={job.tracker.currentStep} isActive={job.tracker.isActive} isAssigned={job.tracker.isAssigned} status={job.status} jobColor={job.c_track} />
              </div>
              <div className="tracker-foot" style={{ background: '#fff' }}>
                <div className="tf-blk"><span className="tf-lbl">{UI.clock} ETA:</span><span className="tf-val">{job.tracker.eta}</span></div>
                <div className="tf-blk"><span className="tf-lbl">Step:</span><span className="tf-val">{job.tracker.cText}</span></div>
                <div className="tf-blk"><span className="tf-lbl">{UI.clock} Upd:</span><span className="tf-val">{job.tracker.timeUpdate}</span></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* Small helper for modal data rows */
function ModalRow({ lbl, val, bold }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
      <div style={{ width: '40%', color: '#64748b', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>{lbl}</div>
      <div style={{ flex: 1, color: '#1e293b', fontWeight: bold ? 800 : 700 }}>{val}</div>
    </div>
  )
}

/* ════════════════════════════════════════
   PRO FORMA THUMBNAIL CARD
   Card stretches to row height. ResizeObserver measures both
   card width & height → scales FIR to fill the available space.
════════════════════════════════════════ */
const FIR_W = 860   // FIR declared width
const FIR_H = 840   // FIR approximate full height

function ProFormaThumbnail({ job, onOpen }) {
  const cardRef = React.useRef(null)
  const titleRef = React.useRef(null)
  const [scale, setScale] = React.useState(0.22)

  React.useEffect(() => {
    if (!cardRef.current) return

    const update = () => {
      const card = cardRef.current
      const title = titleRef.current
      if (!card) return

      const isMobile = window.innerWidth <= 599

      if (isMobile) {
        // Mobile: Scale to show COMPLETE form filling the card
        // Calculate based on card height to maximize visibility
        const titleH = title ? title.offsetHeight + 10 : 24
        const availH = card.clientHeight - 28 - titleH - 10
        // 840px is full form height, scale to fit available space
        const s = (availH / FIR_H) * 0.95 // 95% of available height
        setScale(Math.max(s, 0.22)) // Minimum 0.22, but allow larger if space available
      } else {
        // Desktop: calculate based on available space
        const availW = card.clientWidth - 28
        const titleH = title ? title.offsetHeight + 10 : 24
        const availH = card.clientHeight - 28 - titleH - 10

        const sw = availW / FIR_W
        const sh = availH / FIR_H
        const s = Math.min(sw, sh, 0.35)
        if (s > 0.01) setScale(s)
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(cardRef.current)

    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className="mc-card mc-card-inv"
      style={{ borderColor: job.c_prof, cursor: 'pointer', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onClick={onOpen}
    >
      {/* Title row */}
      <div ref={titleRef} className="mcc-title-row" style={{ color: job.c_prof, flexShrink: 0 }}>
        <span className="mcc-ico" style={{ color: job.c_prof }}>{UI.file}</span>
        PRO FORMA INVOICE
      </div>

      <div style={{
        flex: 1,
        width: '100%',
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 0,
        padding: 4,
      }}>
        <div style={{
          zoom: scale,
          width: FIR_W,
          pointerEvents: 'none',
          transformOrigin: 'top center',
        }}>
          <ProFormaFIR job={job} />
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   PRO FORMA FIR FORM
════════════════════════════════════════ */
function ProFormaFIR({ job, invoice }) {
  const tColor = '#7e22ce'
  return (
    <div className="fir-root" style={{ width: 860, margin: '0 auto' }}>
      <div style={{ padding: 12 }}>
        <div className="fir-hdr-badge" style={{ background: tColor }}>FIR</div>

        <div className="fir-row">
          <div className="fir-photo-box">
            {job?.tech?.photo ? (
              <img src={job.tech.photo} alt="Tech" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="fir-avatar-cir">{UI.user}</div>
            )}
            <button className="fir-photo-btn" style={{ background: tColor }}>
              <span style={{ fontSize: 16, marginTop: -3 }}>&#8673;</span> Upload Photo
            </button>
          </div>
          <div className="fir-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', alignContent: 'center' }}>
            <div className="fir-inp-grp"><span className="fir-lbl">Client Id:</span><div className="fir-inp" style={{ color: '#64748b' }}>{job?.client?.id || ''}</div></div>
            <div className="fir-inp-grp"><span className="fir-lbl">Client Name:</span><div className="fir-inp" style={{ color: '#64748b' }}>{job?.client?.name || ''}</div></div>
            <div className="fir-inp-grp"><span className="fir-lbl">Technician Id:</span><div className="fir-inp" style={{ color: '#64748b' }}>{job?.tech?.id || ''}</div></div>
            <div className="fir-inp-grp"><span className="fir-lbl">Technician Name:</span><div className="fir-inp" style={{ color: '#64748b' }}>{job?.tech?.name || ''}</div></div>
          </div>
        </div>

        <div className="fir-sec" style={{ borderColor: tColor, marginTop: 24 }}>
          <div className="fir-sec-title">
            <span style={{ fontSize: 10 }}>&#9679;</span>
            <span style={{ borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 16px', color: tColor }}>UNIT PERFORMANCE</span>
            <span style={{ fontSize: 10 }}>&#9679;</span>
          </div>
          <div className="fir-up-grid">
            <div className="fir-up-col">
              <div className="fir-up-hdr" style={{ background: tColor }}>CIRCUIT A</div>
              <div className="fir-up-body">
                <div className="fir-up-row"><span>High Pressure</span>: <input type="text" readOnly value={invoice?.circuitAHighPressure ?? ''} /></div>
                <div className="fir-up-row"><span>G.T</span>: <input type="text" readOnly value={invoice?.circuitAGT ?? ''} /></div>
                <div className="fir-up-row"><span>Low Pressure</span>: <input type="text" readOnly value={invoice?.circuitALowPressure ?? ''} /></div>
                <div className="fir-up-row"><span>R.T</span>: <input type="text" readOnly value={invoice?.circuitART ?? ''} /></div>
                <div className="fir-up-row"><span>Power</span>: <input type="text" readOnly value={invoice?.circuitAPower ?? ''} /></div>
                <div className="fir-up-row"><span>Amphere</span>: <input type="text" readOnly value={invoice?.circuitAAmpere ?? ''} /></div>
              </div>
            </div>
            <div className="fir-up-col">
              <div className="fir-up-hdr" style={{ background: tColor }}>CIRCUIT B</div>
              <div className="fir-up-body">
                <div className="fir-up-row"><span>High Pressure</span>: <input type="text" readOnly value={invoice?.circuitBHighPressure ?? ''} /></div>
                <div className="fir-up-row"><span>G.T</span>: <input type="text" readOnly value={invoice?.circuitBGT ?? ''} /></div>
                <div className="fir-up-row"><span>Low Pressure</span>: <input type="text" readOnly value={invoice?.circuitBLowPressure ?? ''} /></div>
                <div className="fir-up-row"><span>R.T</span>: <input type="text" readOnly value={invoice?.circuitBRT ?? ''} /></div>
                <div className="fir-up-row"><span>Power</span>: <input type="text" readOnly value={invoice?.circuitBPower ?? ''} /></div>
                <div className="fir-up-row"><span>Amphere</span>: <input type="text" readOnly value={invoice?.circuitBAmpere ?? ''} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="fir-sec" style={{ borderColor: tColor, marginTop: 24 }}>
          <div className="fir-sec-title">
            <span style={{ fontSize: 10 }}>&#9679;</span>
            <span style={{ borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '0 16px', color: tColor }}>QUOTE</span>
            <span style={{ fontSize: 10 }}>&#9679;</span>
          </div>
          <div className="fir-quote-wrap">
            <table className="fir-quote-tbl">
              <thead>
                <tr><th style={{ width: 50 }}>Sr#</th><th>Description</th><th style={{ width: 80 }}>Qty</th><th style={{ width: 100 }}>Unit Price</th><th style={{ width: 100 }}>Total</th></tr>
              </thead>
              <tbody>
                {(invoice?.items || invoice?.Items)?.length > 0
                  ? (invoice.items || invoice.Items).map((it, idx) => (
                    <tr key={idx}><td>{idx + 1}</td><td>{it.description || it.Description}</td><td>{it.quantity || it.Quantity}</td><td>{it.unitPrice || it.UnitPrice}</td><td>{it.totalPrice || it.TotalPrice}</td></tr>
                  ))
                  : [1, 2, 3].map(i => <tr key={i}><td /><td /><td /><td /><td /></tr>)
                }
              </tbody>
            </table>
          </div>
          <div className="fir-total-row">Total: <input type="text" readOnly value={invoice?.grandTotal ?? invoice?.GrandTotal ?? ''} /></div>
        </div>
      </div>

      <div className="fir-bot-grid">
        {[
          { n: 'INVOICE', val: invoice?.incidentDetails || invoice?.IncidentDetails || '' },
          { n: 'VOUCHER', val: invoice?.voucherNumber || invoice?.VoucherNumber || '' },
          { n: 'CHAT BOX', val: invoice?.chatBox || invoice?.ChatBox || '' },
          { n: 'FINAL NOTE', val: invoice?.finalNote || invoice?.FinalNote || '' },
        ].map(({ n, val }) => (
          <div key={n} className="fir-bot-card" style={{ borderColor: tColor }}>
            <div className="fir-bot-hdr" style={{ background: tColor }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{UI.file} {n}</div>
              <div>•••</div>
            </div>
            <div className="fir-bot-body">
              {val ? (
                <div style={{ fontSize: 11, color: '#1e293b', padding: '6px 4px', whiteSpace: 'pre-wrap' }}>{val}</div>
              ) : n === 'CHAT BOX' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', opacity: 0.35 }}>
                  <div style={{ width: 40, height: 24, background: '#cbd5e1', borderRadius: 6, marginBottom: -8, marginLeft: -15 }} />
                  <div style={{ width: 40, height: 24, background: '#16a34a', borderRadius: 6, marginLeft: 15 }} />
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10, lineHeight: 0.5 }}>...</div>
                </div>
              ) : (
                <><div className="fir-lines" /><div className="fir-lines" /><div className="fir-lines" /></>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   PRO FORMA INVOICE MODAL
════════════════════════════════════════ */
function ProFormaInvoiceModal({ job, onClose }) {
  const [scale, setScale] = React.useState(0.58)
  const [invoice, setInvoice] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    const updateScale = () => {
      if (!modalRef.current) return
      const modalWidth = modalRef.current.clientWidth - 40 // minus padding
      const isMobile = window.innerWidth <= 599

      if (isMobile) {
        // Mobile: scale to fit screen width
        const s = (modalWidth / 860) * 0.95 // 95% of available width
        setScale(Math.min(s, 0.45))
      } else {
        // Desktop: fixed comfortable size
        setScale(0.58)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [loading])

  React.useEffect(() => {
    setLoading(true)
    if (job?.mcId) {
      api.getMasterCardById(job.mcId)
        .then(mc => {
          if (mc && mc.proformaInvoices && mc.proformaInvoices.length > 0) {
            setInvoice(mc.proformaInvoices[0])
          } else {
            setInvoice(null)
          }
        })
        .catch(err => {
          console.error('Failed to fetch invoice:', err)
          setInvoice(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [job])

  return (
    <div className="pf-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        ref={modalRef}
        className="pf-modal"
        onClick={e => e.stopPropagation()}
        style={{ border: '2px solid #7e22ce' }}
      >
        {/* ── Modal Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0
        }}>
          <div className="mcc-title-row" style={{ color: '#7e22ce', fontSize: 13, marginBottom: 0 }}>
            <span className="mcc-ico" style={{ color: '#7e22ce' }}>{UI.file}</span>
            PRO FORMA INVOICE
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', color: '#64748b', flexShrink: 0, marginLeft: 12
            }}
          >
            {UI.close}
          </button>
        </div>

        {/* ── Modal Body: scaled FIR form ── */}
        <div className="pf-modal-body" style={{ overflowX: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#7e22ce', fontWeight: 600 }}>Loading Invoice...</div>
          ) : !invoice ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>No Proforma Invoice found for this job yet.</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>The technician needs to submit the invoice first.</div>
            </div>
          ) : (
            <div style={{ zoom: scale, width: 860 }}>
              <ProFormaFIR job={job} invoice={invoice} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
