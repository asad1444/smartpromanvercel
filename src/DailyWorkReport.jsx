import React, { useState, useEffect } from 'react';
import { api } from './api';
import './DailyWorkReport.css';
import { I } from './icons';





export default function DailyWorkReport() {
  const [selectedDwr, setSelectedDwr] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resReports, resCompanies, resTechs] = await Promise.all([
          api.getDailyWorkReports().catch(() => null),
          api.getCompanies().catch(() => []),
          api.getTechnicians().catch(() => [])
        ]);
        
        if (resReports && resReports.length > 0) {
          setReports(resReports);
        } else {
          setReports([]);
        }
        setCompanies(resCompanies || []);
        setTechnicians(resTechs || []);
      } catch (err) {
        console.error(err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayData = (reports || []).filter(row => {
    const q = searchQuery.toLowerCase();
    const matchSearch  = !q || (row.companyName||'').toLowerCase().includes(q) || (row.technicianName||'').toLowerCase().includes(q) || String(row.dwrid||'').includes(q) || String(row.companyID||'').toLowerCase().includes(q) || String(row.technicianID||'').toLowerCase().includes(q);
    const matchCompany = !companyFilter || String(row.companyID) === String(companyFilter);
    const matchTech    = !techFilter    || String(row.technicianID) === String(techFilter);
    return matchSearch && matchCompany && matchTech;
  });

  const handleViewDetails = async (row) => {
    setSelectedDwr(row);
    setModalLoading(true);
    try {
      const data = await api.getDailyWorkReportById(row.dwrid);
      if (data && Object.keys(data).length > 0) {
        setModalData(data);
      } else {
        setModalData(row);
      }
    } catch (err) {
      console.error("Error fetching DWR details:", err);
      setModalData(row); // fallback to list row data
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Submitted' || status === 'Approved') {
      return (
        <div className="dwr-badge success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          {status}
        </div>
      );
    }
    return (
      <div className="dwr-badge pending">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {status}
      </div>
    );
  };

  return (
    <div className="dwr-container">
      {/* HEADER SECTION */}
      <div className="dwr-header-sec">
        <p className="dwr-desc">View and manage daily work reports submitted by technicians.</p>
        
        <div className="dwr-filters-row">
          <div className="dwr-search-wrap">
            <span className="dwr-search-icon">{I.search}</span>
            <input type="text" placeholder="Search by technician or report..." className="dwr-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <select className="dwr-select" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.companyID} value={c.companyID}>{c.companyName}</option>
            ))}
          </select>
          
          <select className="dwr-select" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
            <option value="">All Technicians</option>
            {technicians.map(t => (
              <option key={t.technicianID} value={t.technicianID}>{t.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="dwr-table-card">
        <table className="dwr-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Technician</th>
              <th>DWR ID</th>
              <th>Report Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No reports found</td></tr>
            ) : displayData.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <div className="td-bold">COMP-{row.companyID}</div>
                  <div className="td-sub">{row.companyName}</div>
                </td>
                <td>
                  <div className="td-bold">TECH-00{row.technicianID}</div>
                  <div className="td-sub">{row.technicianName}</div>
                </td>
                <td>
                  <span className="dwr-id-link" onClick={() => handleViewDetails(row)} style={{ cursor: 'pointer', textDecoration: 'underline', color: 'black' }}>
                    DWR-00{row.dwrid}
                  </span>
                </td>
                <td className="td-date">{new Date(row.reportDate).toLocaleDateString()}</td>
                <td className="dwr-action-cell">
                  <button className="dwr-view-btn" onClick={() => handleViewDetails(row)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* PAGINATION */}
        {displayData.length > 0 && (
          <div className="dwr-pagination">
            <div className="pg-info">Showing {displayData.length} records</div>
            <div className="pg-controls">
              <button className="pg-btn">«</button>
              <button className="pg-btn">‹</button>
              <button className="pg-btn active">1</button>
              <button className="pg-btn">›</button>
              <button className="pg-btn">»</button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP MODAL */}
      {selectedDwr && (
        <div className="dwr-modal-overlay" onClick={() => { setSelectedDwr(null); setModalData(null); }}>
          <div className="dwr-modal" onClick={e => e.stopPropagation()}>
            <div className="dwr-modal-header">
              <h3>Daily Report - DWR-00{selectedDwr.dwrid}</h3>
              <button className="dwr-modal-close" onClick={() => { setSelectedDwr(null); setModalData(null); }}>{I.close}</button>
            </div>
            
            <div className="dwr-modal-body">
              {modalLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>
              ) : modalData ? (
                <>
                  {/* Row 1: Technician Details */}
                  <div className="dm-grid-2">
                    <div className="dm-group">
                      <div className="dm-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Technician Name
                      </div>
                      <div className="dm-box">{selectedDwr.technicianName}</div>
                      
                      <div className="dm-label mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Technician ID
                      </div>
                      <div className="dm-box">TECH-00{selectedDwr.technicianID}</div>
                    </div>
                    
                    <div className="dm-group">
                      <div className="dm-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Duty In
                      </div>
                      <div className="dm-box text-right-icon">
                         <span className="box-icon-l">
                             <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                         </span>
                         {modalData.dutyIn ? new Date(modalData.dutyIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                      
                      <div className="dm-label mt-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Duty Out
                      </div>
                      <div className="dm-box text-right-icon">
                         <span className="box-icon-l">
                             <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                         </span>
                         {modalData.dutyOut ? new Date(modalData.dutyOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2: Status Cards */}
                  <div className="dm-grid-3 mt-3">
                    <div className="dm-stat-card">
                      <div className="dm-sc-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M7 2l10 10-10 10V2z" stroke="none" fill="none"/><polygon points="4 2 20 2 16 10 20 18 4 18 8 10 4 2" stroke="#F97316" strokeWidth="2" fill="none" /></svg>
                        Pending
                      </div>
                      <div className="dm-sc-val">{modalData.pendingJobs.toString().padStart(2, '0')}</div>
                    </div>
                    <div className="dm-stat-card">
                      <div className="dm-sc-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#002147" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        Repeat
                      </div>
                      <div className="dm-sc-val">{modalData.repeatJobs.toString().padStart(2, '0')}</div>
                    </div>
                    <div className="dm-stat-card">
                      <div className="dm-sc-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Completed
                      </div>
                      <div className="dm-sc-val">{modalData.completedJobs.toString().padStart(2, '0')}</div>
                    </div>
                  </div>
                  
                  {/* Row 3: Detail Cards (Wallet only) */}
                  <div className="dm-grid-3 mt-3">
                    <div className="dm-stat-card">
                      <div className="dm-sc-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>
                        Wallet Balance
                      </div>
                      <div className="dm-sc-val sm-val">PKR {modalData.walletBalance?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</div>
                    </div>
                  </div>
                  
                  {/* Notes Sections */}
                  <div className="dm-note-card mt-3">
                    <div className="dm-sc-label border-b pb-2 mb-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      Final Note
                    </div>
                    <div className="dm-note-text">
                      {modalData.finalNote || 'No final note provided.'}
                    </div>
                  </div>
                  
                  <div className="dm-note-card mt-3">
                    <div className="dm-sc-label border-b pb-2 mb-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#0D4F3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h.01"/></svg>
                      Record
                    </div>
                    <div className="dm-note-text">
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {modalData.record ? (
                          modalData.record.split(',').map((mcid, idx) => (
                            <a href={`/job/${mcid.trim().replace('MCID-', '')}`} key={idx} className="mcid-pill" target="_blank" rel="noreferrer">
                              {mcid.trim()}
                            </a>
                          ))
                        ) : 'No MCIDs recorded.'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Failed to load data.</div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* OVERLAY FOR DROPDOWN */}
      {actionMenuOpen && <div className="dwr-overlay-clear" onClick={() => setActionMenuOpen(null)} />}
    </div>
  );
}
