import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import './UnitRegistration.css';
import { I } from './icons';

const API_BASE = 'https://webapicoderepo.onrender.com';

export default function UnitRegistration() {
  const [selectedUnit, setSelectedUnit]     = useState(null);
  const [detailData,   setDetailData]       = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [registrations, setRegistrations]   = useState([]);
  const [loading,       setLoading]         = useState(true);
  const [searchQuery,   setSearchQuery]     = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [currentPage,   setCurrentPage]     = useState(1);
  const recordsPerPage = 10;

  const getRegistrationStatus = (status, registrationDate, currentStep) => {
    const value = String(status || '').trim();
    const normalized = value.toLowerCase();
    const step = String(currentStep || '').trim();
    const stepLower = step.toLowerCase();

    if (registrationDate) {
      if (normalized === 'completed' || normalized === 'submitted') return 'Completed';
      if (stepLower === 'unitregistration' || stepLower === 'onway' || stepLower === 'fir' || stepLower === 'quote' || stepLower === 'fcr') return 'In Progress';
      return 'Completed';
    }

    if (normalized === 'submitted' || normalized === 'completed') return 'Completed';
    if (normalized === 'in progress') return 'In Progress';
    if (stepLower === 'unitregistration' || stepLower === 'onway' || stepLower === 'fir' || stepLower === 'quote' || stepLower === 'fcr') return 'In Progress';
    return 'Pending';
  };

  // ── Load all unit registrations ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/UnitRegistrations/search`).then(r => r.json());
      const rows = Array.isArray(res) ? res : [];
      setRegistrations(rows.map(r => ({
        id:          r.unitID,
        jobId:       r.jobID,
        techId:      `TECH-${r.technicianID}`,
        techName:    r.technicianName || 'N/A',
        compId:      `CO-${r.companyID || 1}`,
        compName:    r.companyName || 'N/A',
        status:      getRegistrationStatus(r.status, r.registrationDate, r.currentStep),
        date:        r.registrationDate
                        ? new Date(r.registrationDate).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})
                        : '--',
        modelNo:     r.modelNumber || '--',
        serialNo:    r.serialNumber || '--',
        serviceName: r.serviceName || '--',
        qrData:      r.qrCodeData || null,
      })));
    } catch (err) {
      console.error('UnitRegistrations load failed:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open detail modal ─────────────────────────────────────────────────────
  const openDetail = async (row) => {
    setSelectedUnit(row);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const d = await fetch(`${API_BASE}/api/UnitRegistrations/by-job/${row.jobId}`).then(r => r.json());
      setDetailData(d);
    } catch (_) {
      setDetailData(null);
    }
    setDetailLoading(false);
  };

  const filtered = registrations.filter(row => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (row.techName||'').toLowerCase().includes(q)
        || (row.compName||'').toLowerCase().includes(q)
        || (row.modelNo||'').toLowerCase().includes(q)
        || (row.serialNo||'').toLowerCase().includes(q)
        || String(row.id).includes(q);
  });

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const displayRecords = filtered.slice(indexOfFirstRecord, indexOfLastRecord);

  // QR visual removed as per requirements

  return (
    <div className="ur-container">
      {/* HEADER */}
      <div className="ur-header-sec">
        <p className="ur-desc">Unit registrations submitted by technicians after job completion.</p>
        <div className="ur-filters-row">
          <div className="ur-search-wrap">
            <span className="ur-search-icon">{I.search}</span>
            <input
              type="text"
              placeholder="Search by technician, model, serial..."
              className="ur-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="ur-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>
            Loading registrations...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>
            No unit registrations found.
          </div>
        ) : (
          <table className="ur-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Technician</th>
                <th>Report Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button className="ur-id-link" onClick={() => openDetail(row)}>
                      {`Unit-${String(row.id).padStart(3, '0')}`}
                    </button>
                  </td>
                  <td>
                    <div className="td-bold">{row.techId}</div>
                    <div className="td-sub">{row.techName}</div>
                  </td>
                  <td className="td-date">{row.date}</td>
                  <td>
                    <span className={`ur-badge ${row.status === 'Completed' ? 'success' : row.status === 'In Progress' ? 'pending' : 'pending'}`}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                  <td className="ur-action-cell">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDetail(row); }}
                      style={{ padding: '6px 14px', background: '#0D4F3C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'Poppins, sans-serif' }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 20px', gap: 10, alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginRight: 'auto' }}>
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filtered.length)} of {filtered.length} records
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
      </div>

      {/* DETAIL MODAL */}
      {selectedUnit && (
        <div className="ur-modal-overlay" onClick={() => { setSelectedUnit(null); setDetailData(null); }}>
          <div className="ur-modal" onClick={e => e.stopPropagation()}
               style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ur-modal-header">
              <div className="ur-mh-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <h3>Unit Registration — UR-{String(selectedUnit.id).padStart(3,'0')}</h3>
              </div>
              <button className="ur-modal-close"
                onClick={() => { setSelectedUnit(null); setDetailData(null); }}>
                {I.close}
              </button>
            </div>

            <div className="ur-modal-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>
                  Loading details...
                </div>
              ) : detailData ? (
                <>
                  {/* Row 1: Client Details (Auto Filled) */}
                  <div className="ur-grid-2">
                    <div className="ur-group">
                      <div className="ur-lbl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Date
                      </div>
                      <div className="ur-box text-right-icon">
                        {detailData.registrationDate
                          ? new Date(detailData.registrationDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
                          : '--'}
                      </div>
                      
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Mobile Number
                      </div>
                      <div className="ur-box">
                        {detailData.clientMobileNumber || '--'}
                      </div>
                    </div>
                    
                    <div className="ur-group">
                      <div className="ur-lbl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        Home Address
                      </div>
                      <div className="ur-box">
                        {detailData.clientArea || '--'}
                      </div>
                      
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Zone
                      </div>
                      <div className="ur-box">
                        {detailData.clientZone || '--'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2: Technician Entered Details */}
                  <div className="ur-grid-2 mt-3">
                    <div className="ur-group">
                      <div className="ur-lbl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                        Model No.
                      </div>
                      <div className="ur-box" style={{ fontWeight: 700 }}>
                        {detailData.modelNumber || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
                        Zone
                      </div>
                      <div className="ur-box">
                        {detailData.zone || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                        Area
                      </div>
                      <div className="ur-box">
                        {detailData.area || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                        Street
                      </div>
                      <div className="ur-box">
                        {detailData.street || '--'}
                      </div>
                    </div>
                    
                    <div className="ur-group">
                      <div className="ur-lbl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 8h16"/><path d="M4 16h16"/><path d="M8 4v16"/><path d="M16 4v16"/></svg>
                        Serial No.
                      </div>
                      <div className="ur-box" style={{ fontWeight: 700 }}>
                        {detailData.serialNumber || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                        Floor
                      </div>
                      <div className="ur-box">
                        {detailData.floor || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        Floor Zone
                      </div>
                      <div className="ur-box">
                        {detailData.floorZone || '--'}
                      </div>
                      <div className="ur-lbl mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        Top Zone
                      </div>
                      <div className="ur-box">
                        {detailData.topZone || '--'}
                      </div>
                    </div>
                  </div>

                  {/* Images & Videos Sections */}
                  {detailData.images && detailData.images.length > 0 && (
                    <div className="ur-note-card mt-3">
                      <div className="ur-sc-label border-b pb-2 mb-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Images & Media
                      </div>
                      <div className="dm-note-text">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {detailData.images.map((img, i) => (
                            <div key={i} style={{
                              width: 100, height: 100, borderRadius: 8,
                              border: '1px solid #e2e8f0', overflow: 'hidden',
                              background: '#f8fafc', position: 'relative'
                            }}>
                              <img
                                src={img.filePath}
                                alt={`img-${i}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {detailData.videos && detailData.videos.length > 0 && (
                    <div className="ur-note-card mt-3">
                      <div className="ur-sc-label border-b pb-2 mb-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        Videos
                      </div>
                      <div className="dm-note-text">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {detailData.videos.map((vid, i) => (
                            <div key={i} style={{
                              width: 160, height: 100, borderRadius: 8,
                              border: '1px solid #e2e8f0', overflow: 'hidden',
                              background: '#000'
                            }}>
                              <video
                                src={vid.filePath}
                                controls
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>
                  No details available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {actionMenuOpen && (
        <div className="ur-overlay-clear" onClick={() => setActionMenuOpen(null)} />
      )}
    </div>
  );
}
