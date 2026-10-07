import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { I } from './icons';
import './Dashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://webapicoderepo.onrender.com';

/* ─── Sparkline ──────────────────────────────────────────────────────────── */
function Sparkline({ color = '#123524', pts = [3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10] }) {
  const W = 110, H = 28;
  const mn = Math.min(...pts), mx = Math.max(...pts);
  const d = pts.map((v, i) =>
    `${(i / (pts.length - 1)) * W},${H - ((v - mn) / (mx - mn || 1)) * (H - 4) - 2}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 28, display: 'block' }}>
      <polyline points={d} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Bar Chart (dynamic) ────────────────────────────────────────────────── */
function BarChart({ barData = [] }) {
  if (!barData.length) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', color: '#94a3b8', fontSize: 13, fontFamily: 'Poppins,sans-serif'
    }}>
      No data yet
    </div>
  );
  const mx = Math.max(...barData.map(b => b.count || 0)) || 1;
  const BW = 32, GAP = 20, maxH = 140, padL = 8, padB = 26;
  const totalW = barData.length * (BW + GAP) - GAP;
  return (
    <svg viewBox={`0 0 ${totalW + padL * 2} ${maxH + padB}`}
      style={{ width: '100%', height: '100%', maxHeight: 180, display: 'block' }}>
      {barData.map((b, i) => {
        const v = b.count || 0;
        const bh = (v / mx) * maxH;
        const x = padL + i * (BW + GAP);
        const y = maxH - bh;
        const isM = v === mx;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BW} height={bh} rx="4"
              fill={isM ? '#123524' : '#e8ecea'}
              style={{ cursor: 'pointer', transition: 'opacity .15s' }}
              onMouseEnter={e => (e.target.style.opacity = .75)}
              onMouseLeave={e => (e.target.style.opacity = 1)} />
            <text x={x + BW / 2} y={y - 4} textAnchor="middle" fontSize="10"
              fill="#64748b" fontFamily="Poppins,sans-serif">{v > 0 ? v : ''}</text>
            <text x={x + BW / 2} y={maxH + padB - 4} textAnchor="middle" fontSize="11"
              fill={isM ? '#002147' : '#64748b'}
              fontWeight={isM ? '800' : '500'}
              fontFamily="Poppins,sans-serif">
              {b.label || b.date || ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Donut / Pie Chart (dynamic) ────────────────────────────────────────── */
function DonutChart({ data = [] }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const cx = 80, cy = 76, R = 64;
  let start = -90;
  const slices = data.map(d => {
    const pct = d.pct ?? Math.round((d.value / total) * 100);
    const ang = (pct / 100) * 360;
    const end = start + ang;
    const lg = ang > 180 ? 1 : 0;
    const ra = a => (a * Math.PI) / 180;
    const x1 = cx + R * Math.cos(ra(start));
    const y1 = cy + R * Math.sin(ra(start));
    const x2 = cx + R * Math.cos(ra(end));
    const y2 = cy + R * Math.sin(ra(end));
    const mid = start + ang / 2;
    const lR = R * 0.70;
    const lx = cx + lR * Math.cos(ra(mid));
    const ly = cy + lR * Math.sin(ra(mid));
    const pth = `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} Z`;
    start = end;
    return { ...d, pct, pth, lx, ly };
  });
  return (
    <svg viewBox="0 0 160 152" style={{ width: 152, height: 152, flexShrink: 0 }}>
      {slices.map((s, i) => (
        <path key={i} d={s.pth} fill={s.color} stroke="#fff" strokeWidth="2.5"
          style={{ cursor: 'pointer', transition: 'opacity .15s' }}
          onMouseEnter={e => (e.target.style.opacity = .8)}
          onMouseLeave={e => (e.target.style.opacity = 1)} />
      ))}
      {slices.map((s, i) =>
        s.pct >= 5 && (
          <text key={i} x={s.lx} y={s.ly} textAnchor="middle"
            dominantBaseline="middle" fontSize="11.5" fill="white"
            fontWeight="700" fontFamily="Poppins,sans-serif">
            {s.pct}%
          </text>
        )
      )}
    </svg>
  );
}

/* ─── Tech Gauge (dynamic) ───────────────────────────────────────────────── */
function TechGauge({ value = 0 }) {
  const cx = 65, cy = 65, r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(value, 100) / 100) * circ;
  return (
    <svg viewBox="0 0 130 130" style={{ width: 130, height: 130, display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8ecea" strokeWidth="14" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#123524" strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="23" fontWeight="800"
        fill="#002147" fontFamily="Poppins,sans-serif">{value}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10.5"
        fill="#94a3b8" fontFamily="Poppins,sans-serif">On Duty</text>
    </svg>
  );
}

/* ─── Pakistan Map ───────────────────────────────────────────────────────── */
const createBubble = (color, num) => L.divIcon({
  className: '',
  html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.25);border:2px solid #fff;">${num}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const createTechMarker = (name, isJob) => {
  const color = isJob ? '#002147' : '#123524';
  const label = isJob ? 'On Job' : 'Online';
  return L.divIcon({
    className: 'custom-tech-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; width: 120px; margin-left: -60px; margin-top: -45px;">
        <div style="background: ${color}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 2;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div style="background: white; padding: 4px 10px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; margin-top: -12px; pt: 12px; z-index: 1;">
          <div style="height: 12px;"></div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; font-family: 'Poppins', sans-serif;">${name || 'Technician'}</div>
          <div style="font-size: 9px; font-weight: 600; color: ${color}; white-space: nowrap; font-family: 'Poppins', sans-serif; display: flex; align-items: center; gap: 3px;">
            <span style="display: inline-block; width: 5px; height: 5px; background: ${color}; border-radius: 50%;"></span> ${label}
          </div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const PAKISTAN_CENTER = [30.3753, 69.3451];
const STATUS_PILL_COLORS = {
  'In Progress': { bg: '#e5eaf0', color: '#002147' },
  Assigned: { bg: '#e8ecea', color: '#123524' },
  Completed: { bg: '#eff6ff', color: '#2563eb' },
  New: { bg: '#f8fafc', color: '#475569' },
  Pending: { bg: '#f1f5f9', color: '#64748b' },
  Cancelled: { bg: '#fef2f2', color: '#dc2626' },
  Stuck: { bg: '#fef2f2', color: '#dc2626' },
};

/* ─── All Jobs Modal ──────────────────────────────────────────────────────── */
function AllJobsModal({ jobs = [], onClose }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;

  const filteredJobs = jobs.filter(j => 
    (j.customerDetails?.name || j.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.jobID || j.id || '').toString().toLowerCase().includes(search.toLowerCase()) ||
    (j.assignedTech || j.tName || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const currentJobs = filteredJobs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, []);

  return (
    <div className="ajm-overlay" onClick={onClose}>
      <style>{`
        .leaflet-control-zoom { display: none !important; }
        .ajm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: ajm-fade 0.2s ease-out forwards;
        }
        .ajm-box {
          background: #ffffff;
          width: 100%; max-width: 950px;
          max-height: calc(100vh - 40px);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: ajm-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes ajm-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes ajm-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ajm-hdr {
          padding: 20px 24px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #f1f5f9;
          background: #fff;
        }
        .ajm-title {
          font-size: 18px; font-weight: 700; color: #0f172a;
          font-family: 'Poppins', sans-serif;
          display: flex; align-items: center; gap: 10px;
        }
        .ajm-badge {
          background: #f1f5f9; color: #475569; font-size: 11px;
          padding: 4px 10px; border-radius: 999px; font-weight: 600;
        }
        .ajm-close {
          width: 32px; height: 32px;
          border-radius: 8px; border: none; background: #f8fafc;
          color: #64748b; font-size: 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ajm-close:hover { background: #fee2e2; color: #ef4444; }
        .ajm-close svg { width: 16px; height: 16px; }
        
        .ajm-toolbar {
          padding: 16px 24px; background: #fafaf9;
          border-bottom: 1px solid #f1f5f9;
        }
        .ajm-search-wrap {
          position: relative;
          width: 100%;
        }
        .ajm-search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: #94a3b8; display: flex; align-items: center; justify-content: center;
        }
        .ajm-search-icon svg { width: 14px; height: 14px; }
        .ajm-search {
          width: 100%; padding: 8px 14px 8px 34px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          outline: none; font-family: 'Poppins', sans-serif; font-size: 13px;
          transition: all 0.2s; background: #fff; box-sizing: border-box;
          color: #0f172a;
        }
        .ajm-search::placeholder { color: #94a3b8; }
        .ajm-search:focus {
          border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        .ajm-body {
          flex: 1; overflow-y: auto; background: #fff;
        }
        .ajm-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          font-family: 'Poppins', sans-serif;
        }
        .ajm-table th {
          position: sticky; top: 0; background: #f8fafc;
          padding: 12px 24px; text-align: left; font-size: 11px;
          font-weight: 600; color: #64748b; text-transform: uppercase;
          letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0;
          z-index: 10;
        }
        .ajm-table td {
          padding: 16px 24px; font-size: 13px; color: #334155;
          border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
        }
        .ajm-tr { transition: background 0.15s; cursor: default; }
        .ajm-tr:hover td { background: #f8fafc; }
        
        .ajm-ftr {
          padding: 16px 24px; background: #fff; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ajm-page-info { font-size: 13px; color: #64748b; font-family: 'Poppins', sans-serif; }
        .ajm-page-btn {
          padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #fff; color: #0f172a; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; font-family: 'Poppins', sans-serif;
        }
        .ajm-page-btn:not(:disabled):hover {
          background: #f1f5f9; border-color: #cbd5e1;
        }
        .ajm-page-btn:disabled {
          opacity: 0.5; cursor: not-allowed; background: #f8fafc;
        }
      `}</style>
      <div className="ajm-box" onClick={e => e.stopPropagation()}>
        <div className="ajm-hdr">
          <div className="ajm-title">
            All Live Jobs
            <span className="ajm-badge">{filteredJobs.length} Jobs</span>
          </div>
          <button className="ajm-close" onClick={onClose} aria-label="Close modal">
            {I.close || '×'}
          </button>
        </div>
        
        <div className="ajm-toolbar">
          <div className="ajm-search-wrap">
            <span className="ajm-search-icon">{I.search || '🔍'}</span>
            <input 
              className="ajm-search"
              type="text" 
              placeholder="Search by Job ID, Customer, or Tech..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="ajm-body">
          <table className="ajm-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: 36, marginBottom: 16, filter: 'grayscale(1)', opacity: 0.5 }}>📭</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>No jobs found</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Try adjusting your search terms</div>
                  </td>
                </tr>
              ) : currentJobs.map((job, i) => {
                const jobId = job.jobID || job.id || `#${(page-1)*itemsPerPage + i + 1}`;
                const custName = job.customerDetails?.name || job.clientName || job.custName || '--';
                const techName = job.assignedTech || job.tName || 'Unassigned';
                const status = job.statusFlag || job.status || 'Pending';
                const amount = job.collectedAmount ? `PKR ${job.collectedAmount}` : (job.financialAmount || job.amt || 'PKR 0');
                const date = job.timeMetric ? new Date(job.timeMetric).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : (job.eta || '--');
                const sc = STATUS_PILL_COLORS[status] || STATUS_PILL_COLORS['New'] || { bg: '#f1f5f9', color: '#64748b' };
                
                return (
                  <tr key={i} className="ajm-tr">
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{jobId}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{custName}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {techName !== 'Unassigned' && (
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#123524', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                            {techName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: 500, color: '#334155' }}>{techName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{amount}</td>
                    <td style={{ color: '#64748b' }}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="ajm-ftr">
            <div className="ajm-page-info">Showing page <strong>{page}</strong> of <strong>{totalPages}</strong></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ajm-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <button className="ajm-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   DASHBOARD
════════════════════════════════════ */
export default function Dashboard({ selectedCompany, filteredJobs = [], onOpenModal, onClearFilter }) {
  const [barRange, setBarRange] = useState('monthly');
  const [showAllJobs, setShowAllJobs] = useState(false);
  
  const companyId = selectedCompany?.id || null;
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['dashboard', companyId, barRange],
    queryFn: async () => {
      if (companyId) {
        const [kpiRes, statusRes, trendRes, jobsRes, techRes, locRes] = await Promise.all([
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/kpi`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/job-status-chart`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/monthly-distribution?range=${barRange}`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/recent-jobs`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/technician-stats`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Company/${companyId}/Dashboard/live-job-locations`).then(r => r.json()).catch(() => null),
        ]);
        return {
          kpi: { totalJobs: kpiRes?.totalJobs ?? 0, companies: 1 },
          charts: {
            jobDistribution: {
              done: statusRes?.completed ?? 0,
              inProgress: statusRes?.inProgress ?? 0,
              pending: statusRes?.pending ?? 0,
              stuck: statusRes?.stuck ?? statusRes?.canceled ?? 0,
            },
            monthlyTrend: (trendRes?.labels || []).map((label, index) => ({
              label,
              count: trendRes?.values?.[index] ?? 0,
            })),
          },
          jobs: Array.isArray(jobsRes) ? jobsRes.map(job => ({
            jobID: job.jobID,
            customerDetails: { name: job.clientName, displayID: job.crNumber },
            assignedTech: job.technicianName,
            statusFlag: job.status,
            financialAmount: job.amount ? `PKR ${job.amount}` : 'PKR 0',
            timeMetric: job.createdAt,
          })) : [],
          techSum: {
            totalFleet: techRes?.total ?? 0,
            activeOnlineNow: techRes?.online ?? 0,
            onAJob: techRes?.onJob ?? 0,
            offDutyInactive: (techRes?.offline ?? 0) + (techRes?.onLeave ?? 0),
          },
          liveLocations: Array.isArray(locRes) ? locRes : []
        };
      } else {
        const [kpiRes, chartRes, jobsRes, techRes, locRes] = await Promise.all([
          fetch(`${API_BASE}/api/Dashboard/kpi`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Dashboard/charts?range=${barRange}`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Dashboard/live-jobs`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Technicians/summary`).then(r => r.json()).catch(() => null),
          fetch(`${API_BASE}/api/Dashboard/live-map`).then(r => r.json()).catch(() => null),
        ]);
        return {
          kpi: kpiRes,
          charts: chartRes,
          jobs: jobsRes?.value && Array.isArray(jobsRes.value) ? jobsRes.value : (Array.isArray(jobsRes) ? jobsRes : []),
          techSum: techRes,
          liveLocations: Array.isArray(locRes) ? locRes : []
        };
      }
    }
  });

  const kpi = dashboardData?.kpi ?? null;
  const charts = dashboardData?.charts ?? null;
  const jobs = dashboardData?.jobs ?? [];
  const techSum = dashboardData?.techSum ?? null;
  const liveLocations = dashboardData?.liveLocations ?? [];

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', backgroundColor: '#f8fafc' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#002147', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 16, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>Loading Dashboard...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const totalJobs = kpi?.totalJobs ?? 0;
  const companies = kpi?.companies ?? 0;
  const dist = charts?.jobDistribution ?? {};
  const completed = dist.done ?? 0;
  const inProgress = dist.inProgress ?? 0;
  const pending = dist.pending ?? 0;
  const stuck = dist.stuck ?? dist.cancelled ?? dist.canceled ?? 0;
  const totalDist = completed + inProgress + pending + stuck || 1;

  // Pie data from real counts
  const pieData = [
    { label: 'Completed', value: completed, pct: Math.round(completed / totalDist * 100), color: '#123524' },
    { label: 'In Progress', value: inProgress, pct: Math.round(inProgress / totalDist * 100), color: '#002147' },
    { label: 'Pending', value: pending, pct: Math.round(pending / totalDist * 100), color: '#64748b' },
    { label: 'Stuck', value: stuck, pct: Math.round(stuck / totalDist * 100), color: '#EF4444' },
  ];

  // Bar chart — selected range trend from API
  const barData = Array.isArray(charts?.monthlyTrend) && charts.monthlyTrend.length > 0
    ? charts.monthlyTrend.map(m => ({
      label: m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (m.label || ''),
      count: m.count || 0,
    }))
    : [];

  // Technician stats
  const totalTech = techSum?.totalFleet ?? 0;
  const onlineTech = techSum?.activeOnlineNow ?? 0;
  
  // Calculate on-job technicians from live jobs if API returns 0
  const activeTechsFromJobs = new Set(
    (jobs.length > 0 ? jobs : (Array.isArray(filteredJobs) ? filteredJobs : []))
      .filter(j => ['In Progress', 'Assigned'].includes(j.statusFlag || j.status))
      .map(j => j.assignedTech || j.tName)
      .filter(name => name && name !== 'Unassigned')
  ).size;
  const onJobTech = (techSum?.onAJob > 0) ? techSum.onAJob : activeTechsFromJobs;
  
  const offTech = techSum?.offDutyInactive ?? 0;
  const utilPct = totalTech > 0 ? Math.round(((onlineTech + onJobTech) / totalTech) * 100) : 0;

  // Live jobs table
  const displayJobs = jobs.length > 0 ? jobs
    : (Array.isArray(filteredJobs) && filteredJobs.length > 0 ? filteredJobs : []);

  return (
    <div className="db-wrap">

      {/* Filter banner */}
      {selectedCompany && (
        <div className="db-filter-banner">
          <span>Showing dashboard for <strong>{selectedCompany.name}</strong></span>
          <button className="db-clear-btn" onClick={onClearFilter}>Clear Filter ×</button>
        </div>
      )}

      {/* ══════ ROW 1 — KPI CARDS ══════ */}
      <div className="db-kpi-row">

        {/* Total Jobs */}
        <div className="db-card db-kpi-card" onClick={onOpenModal} style={{ cursor: 'pointer' }}>
          <div className="db-kpi-top">
            <div className="db-kpi-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
              {I.briefcase}
            </div>
            <div className="db-kpi-text">
              <div className="db-kpi-label">Total Jobs</div>
              <div className="db-kpi-value">{totalJobs.toLocaleString()}</div>
              <div className="db-kpi-trend up">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
                All time
              </div>
            </div>
          </div>
          <div className="db-sparkline">
            <Sparkline color="#123524" pts={[1, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7, totalJobs || 1]} />
          </div>
        </div>

        {/* Total Companies */}
        <div className="db-card db-kpi-card">
          <div className="db-kpi-top">
            <div className="db-kpi-icon" style={{ background: '#e8ecea', color: '#123524' }}>
              {I.briefcase}
            </div>
            <div className="db-kpi-text">
              <div className="db-kpi-label">Companies</div>
              <div className="db-kpi-value">{companies.toLocaleString()}</div>
              <div className="db-kpi-trend up">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
                Registered
              </div>
            </div>
          </div>
          <div className="db-sparkline">
            <Sparkline color="#123524" pts={[1, 2, 2, 3, 3, 4, 4, 5, 5, 6, companies || 1, companies || 1]} />
          </div>
        </div>

        {/* Total Technicians */}
        <div className="db-card db-tech-card">
          <div className="db-kpi-top" style={{ alignItems: 'flex-start' }}>
            <div className="db-kpi-icon" style={{ background: '#e5eaf0', color: '#002147' }}>
              {I.users}
            </div>
            <div className="db-kpi-text" style={{ flex: 1 }}>
              <div className="db-kpi-label">Total Technicians</div>
              <div className="db-kpi-value">{totalTech}</div>
              <div className="db-leave-badge" style={{ background: onlineTech > 0 ? '#e8f5ec' : '#f1f5f9', color: onlineTech > 0 ? '#16a34a' : '#64748b' }}>
                {onlineTech} Online · {onJobTech} On Job
              </div>
            </div>
          </div>
          <div className="db-avatars">
            <div className="db-av" style={{ background: '#6d28d9' }}>T</div>
            <div className="db-av" style={{ background: '#123524' }}>T</div>
            <div className="db-av" style={{ background: '#002147' }}>T</div>
            {totalTech > 3 && <div className="db-av db-av-plus">+{totalTech - 3}</div>}
          </div>
        </div>

        {/* 2×2 Status Grid — DYNAMIC */}
        <div className="db-status-grid">
          <div className="db-card db-stat-box">
            <div className="db-stat-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>{I.briefcase}</div>
            <div>
              <div className="db-stat-label">Pending</div>
              <div className="db-stat-val" style={{ color: '#0ea5e9' }}>{pending}</div>
            </div>
          </div>
          <div className="db-card db-stat-box">
            <div className="db-stat-icon" style={{ background: '#e5eaf0', color: '#002147' }}>{I.clock}</div>
            <div>
              <div className="db-stat-label">In Progress</div>
              <div className="db-stat-val" style={{ color: '#002147' }}>{inProgress}</div>
            </div>
          </div>
          <div className="db-card db-stat-box">
            <div className="db-stat-icon" style={{ background: '#e8ecea', color: '#123524' }}>{I.checkCirc}</div>
            <div>
              <div className="db-stat-label">Completed</div>
              <div className="db-stat-val" style={{ color: '#123524' }}>{completed.toLocaleString()}</div>
            </div>
          </div>
          <div className="db-card db-stat-box">
            <div className="db-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>{I.xCirc}</div>
            <div>
              <div className="db-stat-label">Stuck</div>
              <div className="db-stat-val" style={{ color: '#dc2626' }}>{stuck}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ ROW 2 — CHARTS ══════ */}
      <div className="db-charts-row">

        {/* Monthly Job Distribution — DYNAMIC BAR CHART */}
        <div className="db-card db-chart-card">
          <div className="db-card-hdr">
            <div>
              <div className="db-card-title">{barRange === 'weekly' ? 'Weekly' : barRange === 'yearly' ? 'Yearly' : 'Monthly'} Job Distribution</div>
              <div className="db-card-sub">
                {barData.length > 0
                  ? `${barData.length} data points this period`
                  : `No jobs recorded for this ${barRange} period yet`}
              </div>
            </div>
            <select
              className="db-select"
              value={barRange}
              onChange={e => setBarRange(e.target.value)}
              aria-label="Job distribution range"
              style={{ cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="db-chart-body">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontFamily: 'Poppins,sans-serif', fontSize: 13 }}>Loading...</div>
            ) : (
              <BarChart barData={barData} />
            )}
          </div>
        </div>

        {/* Live Job Map */}
        <div className="db-card db-map-card">
          <div className="db-card-hdr">
            <div className="db-map-title-row">
              <div className="db-card-title">Live Job Map (Pakistan)</div>
              <div className="db-live-pill">
                <span className="db-live-dot" />Live
              </div>
            </div>
            <div className="db-map-legend">
              <span className="db-leg-item"><span className="db-leg-dot" style={{ background: '#123524' }} />Live Jobs</span>
              <span className="db-leg-item"><span className="db-leg-dot" style={{ background: '#002147' }} />In Progress</span>
              <span className="db-leg-item"><span className="db-leg-dot" style={{ background: '#0ea5e9' }} />Pending</span>
            </div>
          </div>
          <div className="db-map-body">
            <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
              <MapContainer center={PAKISTAN_CENTER} zoom={5} zoomControl={false}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%', background: '#fafaf9' }}>
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  attribution='Tiles &copy; Esri' />
                {/* Dynamic job pins by live locations */}
                {liveLocations.filter(l => (l.latitude || l.Latitude) && (l.longitude || l.Longitude)).map((l, i) => {
                  // Add jitter so markers with same coords don't perfectly overlap
                  const lat = (l.latitude || l.Latitude) + (Math.sin(i) * 0.05);
                  const lng = (l.longitude || l.Longitude) + (Math.cos(i) * 0.05);
                  const name = l.technicianName || l.fullName || l.FullName || 'Technician';
                  const isJob = (l.liveStatus || l.LiveStatus) === 'OnJob' || (l.liveStatus || l.LiveStatus) === 'On a Job';
                  const locName = l.locationName || l.LocationName || 'Unknown Location';
                  return (
                    <Marker key={i} position={[lat, lng]} icon={createTechMarker(name, isJob)}>
                      <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                        <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '12px' }}>
                          <strong>{name}</strong><br/>
                          Location: {locName}
                        </div>
                      </Tooltip>
                    </Marker>
                  );
                })}
                {/* No dummy fallback, only actual technicians are shown */}
                {!showAllJobs && <ZoomControl position="bottomright" />}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Jobs Status Donut — DYNAMIC */}
        <div className="db-card db-donut-card">
          <div className="db-card-hdr" style={{ paddingBottom: 8 }}>
            <div className="db-card-title">Jobs Status</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>Total: {totalJobs}</div>
          </div>
          <div className="db-donut-body">
            {totalDist > 1 ? (
              <DonutChart data={pieData} />
            ) : (
              <div style={{
                width: 152, height: 152, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', background: '#f1f5f9', flexShrink: 0, fontSize: 12, color: '#94a3b8', fontFamily: 'Poppins,sans-serif'
              }}>
                No data
              </div>
            )}
            <div className="db-donut-legend">
              {pieData.map((d, i) => (
                <div key={i} className="db-leg-row">
                  <span className="db-leg-circle" style={{ background: d.color }} />
                  <div>
                    <div className="db-leg-name">{d.label}</div>
                    <div className="db-leg-count">{d.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ ROW 3 — TABLE + GAUGE ══════ */}
      <div className="db-bottom-row">

        {/* Live Job Status Table — DYNAMIC */}
        <div className="db-card db-table-card">
          <div className="db-card-hdr">
            <div className="db-card-title">Live Job Status</div>
            <button className="db-view-all" onClick={() => setShowAllJobs(true)}>View All Jobs</button>
          </div>
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>JOB ID</th>
                  <th>CUSTOMER</th>
                  <th>TECHNICIAN</th>
                  <th>STATUS</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>Loading...</td></tr>
                ) : displayJobs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>No jobs found.</td></tr>
                ) : displayJobs.slice(0, 8).map((job, i) => {
                  // Map API response fields
                  const jobId = job.jobID || job.id || `#${i + 1}`;
                  const custName = job.customerDetails?.name || job.clientName || job.custName || '--';
                  const custSub = job.customerDetails?.displayID || job.clientContact || job.customerDetails?.phone || job.custId || '';
                  const techName = job.assignedTech || job.tName || 'Unassigned';
                  const status = job.statusFlag || job.status || 'Pending';
                  const amount = job.collectedAmount ? `PKR ${job.collectedAmount}` : (job.financialAmount || job.amt || 'PKR 0');
                  const date = job.timeMetric
                    ? new Date(job.timeMetric).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    : (job.eta || '--');
                  const init = techName !== 'Unassigned' ? techName.substring(0, 2).toUpperCase() : '--';
                  const sc = STATUS_PILL_COLORS[status] || STATUS_PILL_COLORS['New'];

                  return (
                    <tr key={i}>
                      <td className="db-job-id">{jobId}</td>
                      <td>
                        <div className="db-cust-name">{custName}</div>
                        <div className="db-cust-sub">{custSub}</div>
                      </td>
                      <td>
                        <div className="db-tech-cell">
                          <div className="db-tech-av" style={{ background: '#123524', color: '#fff' }}>{init}</div>
                          <span>{techName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="db-status-pill" style={{ background: sc.bg, color: sc.color }}>
                          {status}
                        </span>
                      </td>
                      <td className="db-amt">{amount}</td>
                      <td className={status === 'Completed' ? 'db-eta-green' : 'db-eta'}>{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technician Utilization — DYNAMIC */}
        <div className="db-card db-util-card">
          <div className="db-card-hdr" style={{ paddingBottom: 8 }}>
            <div className="db-card-title">Technician Utilization</div>
          </div>
          <div className="db-util-body">
            <TechGauge value={utilPct} />
            <div className="db-util-legend">
              <div className="db-util-row">
                <span className="db-leg-circle" style={{ background: '#123524' }} />
                <span className="db-util-label">Online / Active</span>
                <span className="db-util-num">{onlineTech}</span>
              </div>
              <div className="db-util-row">
                <span className="db-leg-circle" style={{ background: '#002147' }} />
                <span className="db-util-label">On a Job</span>
                <span className="db-util-num">{onJobTech}</span>
              </div>
              <div className="db-util-row">
                <span className="db-leg-circle" style={{ background: '#87ceeb' }} />
                <span className="db-util-label">Off Duty</span>
                <span className="db-util-num">{offTech}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAllJobs && (
        <AllJobsModal 
          jobs={displayJobs} 
          onClose={() => setShowAllJobs(false)} 
        />
      )}
    </div>
  );
}
