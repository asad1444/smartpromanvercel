import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Companies.css';
import { I } from './icons';
import './AtModal.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



export default function Companies() {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 8;

  const [viewModalData, setViewModalData] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteCompany(deleteConfirmId);
      toast.success('Company deleted successfully!');
        setCompanies(prev => prev.filter(c => c.id !== deleteConfirmId));
    } catch (err) {
      toast.error('Failed to delete company.');
    }
    setDeleteConfirmId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalData) return;
    setSaving(true);
    setFormErr('');
    try {
      const cityParts = editModalData.city.split(' / ');
      const payload = {
        companyID: editModalData.id,
        companyName: editModalData.name,
        serviceType: editModalData.sub,
        inchargeName: editModalData.incharge,
        inchargePhone: editModalData.phone,
        city: cityParts[0] || '',
        zone: cityParts[1] || '',
        status: editModalData.status
      };
      await api.updateCompany(editModalData.id, payload);
      toast.success('Company updated successfully!');
      setCompanies(prev => prev.map(c => c.id === editModalData.id ? { ...c, ...editModalData } : c));
      setEditModalData(null);
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to update company.');
      toast.error('Failed to update company.');
    } finally {
      setSaving(false);
    }
  };

  const updateCompanyStatus = async (companyId, status) => {
    try {
      await api.updateCompanyStatus(companyId, { status });
      setCompanies(prev => prev.map(company =>
        company.id === companyId ? { ...company, status: status === 'Approval' ? 'Active' : status === 'Suspend' ? 'Suspended' : status } : company
      ));
      setActionMenuOpen(null);
      if (status === 'Suspend') toast.success('This company suspended successfully');
      else if (status === 'Approval') toast.success('This company approved successfully');
      else if (status === 'Pending') toast.success('This company set to pending successfully');
    } catch (err) {
      console.error('Company status update failed:', err);
      toast.error('Failed to update company status.');
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiRes, compRes] = await Promise.all([
          api.getCompaniesSummary().catch(() => null),
          api.getCompanies().catch(() => null)
        ]);
        setKpiData(kpiRes);

        // Map API columns: companyID, companyName, serviceType, inchargeName,
        // inchargePhone, city, zone, techniciansCount, jobsCompleted, status
        const mapped = (Array.isArray(compRes) ? compRes : []).map(c => ({
          id:       c.companyID,
          name:     c.companyName      || '--',
          sub:      c.serviceType      || '--',
          incharge: c.inchargeName     || '--',
          phone:    c.inchargePhone    || '--',
          city:     (c.city || '--') + (c.zone ? ' / ' + c.zone : ''),
          techs:    c.techniciansCount ?? 0,
          jobs:     c.jobsCompleted    ?? 0,
          status:   c.status           || 'Pending',
          logo:     c.companyLogo      || null,
        }));
        setCompanies(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayKpi = kpiData?.kpi || [];

  const displayData = (companies || []).filter(row => {
    const q = search.toLowerCase();
    const matchSearch = !q || (row.name||'').toLowerCase().includes(q) || (row.incharge||'').toLowerCase().includes(q) || (row.city||'').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (row.status||'').toLowerCase() === statusFilter.toLowerCase();
    const matchCity   = !cityFilter   || (row.city||'').toLowerCase().includes(cityFilter.toLowerCase());
    return matchSearch && matchStatus && matchCity;
  });

  const cityOptions = [...new Set((companies || [])
    .map(company => company.city)
    .filter(city => city && city !== '--'))].sort();

  const totalPages = Math.max(1, Math.ceil(displayData.length / companiesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstCompanyIndex = (safeCurrentPage - 1) * companiesPerPage;
  const paginatedData = displayData.slice(firstCompanyIndex, firstCompanyIndex + companiesPerPage);

  const changePage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#123524'; /* Theme Green */
      case 'Pending': return '#002147'; /* Theme Orange */
      case 'Suspended': return '#DC2626'; /* Theme Red */
      default: return '#64748b';
    }
  };

  return (
    <div className="comp-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* KPI ROW */}
      <div className="comp-kpi-row">
        {displayKpi.map(kpi => (
          <div key={kpi.id} className={`comp-kpi-card type-${kpi.type}`}>
            <div className="comp-kpi-inner">
              <div className="comp-kpi-left">
                <div className={`comp-kpi-ico bg-${kpi.type}`}>
                  {kpi.icon || I.building}
                </div>
              </div>
              <div className="comp-kpi-right">
                <div className="comp-kpi-title">
                  {kpi.title}
                  {kpi.hasDot && <span className={`comp-kpi-dot dot-${kpi.type}`} />}
                </div>
                <div className="comp-kpi-val">{kpi.value}</div>
                <div className="comp-kpi-lbl">{kpi.label}</div>
              </div>
            </div>
            <div className={`comp-kpi-bar bar-${kpi.type}`} />
          </div>
        ))}
      </div>

      {/* HEADER FILTERS SECTION */}
      <div className="comp-header-sec">
        <div className="comp-filters-row">
          <div className="comp-search-wrap">
            <span className="comp-search-icon">{I.search}</span>
            <input type="text" placeholder="Search company..." className="comp-search-input" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>

          <select className="comp-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <select className="comp-select" value={cityFilter} onChange={e => { setCityFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Cities / Zones</option>
            {cityOptions.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="comp-table-card">
        <table className="comp-table">
          <thead>
            <tr>
              <th>COMPANY PROFILE</th>
              <th>INCHARGE</th>
              <th>CONTACT NUMBER</th>
              <th>CITY / ZONE</th>
              <th>TECHNICIANS</th>
              <th>JOBS COMPLETED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>Loading companies...</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>No companies found.</td></tr>
            ) : paginatedData.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="comp-prof">
                    <div className="comp-logo">
                      {row.logo ? (
                        <img
                          src={row.logo}
                          alt={row.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="comp-logo-fallback" style={{ display: row.logo ? 'none' : 'flex' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={row.color || '#0D4F3C'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                      </span>
                    </div>
                    <div>
                      <div className="td-bold">COMP-{row.id}</div>
                      <div className="td-sub">{row.name}</div>
                    </div>
                  </div>
                </td>
                <td><div className="td-bold">{row.incharge}</div></td>
                <td><div className="td-bold">{row.phone}</div></td>
                <td><div className="td-bold">{row.city}</div></td>
                <td><div className="td-bold">{row.techs}</div></td>
                <td><div className="td-bold">{row.jobs}</div></td>
                <td>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px',
                    padding: '6px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: row.status === 'Active' ? '#e8f5ec' : row.status === 'Pending' ? '#fff7e6' : '#ffe4e4',
                    color: getStatusColor(row.status)
                  }}>{row.status}</span>
                </td>
                <td className="comp-action-cell">
                  <button className="comp-action-btn" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === row.id ? null : row.id); }}>{I.dots}</button>
                  {actionMenuOpen === row.id && (
                    <div className="comp-action-dd" onClick={e => e.stopPropagation()}>
                      <button className="comp-dd-item" onClick={() => { setViewModalData(row); setActionMenuOpen(null); }}>
                        <span className="dd-ico">{I.eye}</span>View Company
                      </button>
                      <button className="comp-dd-item" onClick={() => { setEditModalData(row); setActionMenuOpen(null); }}>
                        <span className="dd-ico">{I.edit}</span>Edit Company
                      </button>
                      <div className="dd-sep" />
                      <button className="comp-dd-item txt-success" onClick={() => updateCompanyStatus(row.id, 'Active')}>
                        <span className="dd-ico">{I.checkCirc}</span>Approval
                      </button>
                      <button className="comp-dd-item txt-warning" onClick={() => updateCompanyStatus(row.id, 'Pending')}>
                        <span className="dd-ico">{I.clock}</span>Pending
                      </button>
                      <button className="comp-dd-item txt-danger" onClick={() => updateCompanyStatus(row.id, 'Suspend')}>
                        <span className="dd-ico">{I.xCirc}</span>Suspend
                      </button>
                      <div className="dd-sep" />
                      <button className="comp-dd-item txt-danger" onClick={() => { setDeleteConfirmId(row.id); setActionMenuOpen(null); }}>
                        <span className="dd-ico">{I.trash}</span>Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        {displayData.length > 0 && (
          <div className="comp-pagination">
            <div className="pg-info">
              Showing {firstCompanyIndex + 1} to {Math.min(firstCompanyIndex + companiesPerPage, displayData.length)} of {displayData.length} entries
            </div>
            <div className="pg-controls">
              <button className="pg-btn pg-nav-btn" onClick={() => changePage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>Previous</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button key={page} className={`pg-btn ${safeCurrentPage === page ? 'active' : ''}`} onClick={() => changePage(page)}>
                  {page}
                </button>
              ))}
              <button className="pg-btn pg-nav-btn" onClick={() => changePage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {actionMenuOpen && <div className="comp-overlay-clear" onClick={() => setActionMenuOpen(null)} />}

      {/* VIEW MODAL */}
      {viewModalData && (
        <div className="at-overlay" onClick={() => setViewModalData(null)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <div className="at-modal-brand">
                <div className="at-modal-logo">SPM</div>
              </div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">View Company</h2>
                <p className="at-modal-sub">Company details</p>
              </div>
              <button className="at-close-btn" onClick={() => setViewModalData(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'var(--t1)', fontWeight: '700', letterSpacing: '-0.5px' }}>{viewModalData.name}</h3>
                  <p style={{ margin: 0, color: '#3b82f6', fontSize: '16px', fontWeight: '600' }}>{viewModalData.sub}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Incharge Name</span>
                  </div>
                  <div style={{ fontSize: '17px', color: 'var(--t1)', fontWeight: '600' }}>{viewModalData.incharge}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</span>
                  </div>
                  <div style={{ fontSize: '17px', color: 'var(--t1)', fontWeight: '600' }}>{viewModalData.phone}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City / Zone</span>
                  </div>
                  <div style={{ fontSize: '17px', color: 'var(--t1)', fontWeight: '600' }}>{viewModalData.city}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                  </div>
                  <div style={{ fontSize: '17px', color: 'var(--t1)', fontWeight: '600' }}>{viewModalData.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalData && (
        <div className="at-overlay" onClick={() => setEditModalData(null)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <div className="at-modal-brand">
                <div className="at-modal-logo">SPM</div>
              </div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">Edit Company</h2>
                <p className="at-modal-sub">Update company information</p>
              </div>
              <button className="at-close-btn" onClick={() => setEditModalData(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {formErr && (
              <div className="at-alert at-alert-err">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {formErr}
              </div>
            )}

            <form className="at-form" onSubmit={handleEditSubmit}>
              <div className="at-form-row">
                <div className="at-form-group">
                  <label className="at-label">Company Name <span className="at-req">*</span></label>
                  <input required type="text" className="at-input" value={editModalData.name} onChange={e => setEditModalData({...editModalData, name: e.target.value})} placeholder="Company Name" />
                </div>
                <div className="at-form-group">
                  <label className="at-label">Service Type <span className="at-req">*</span></label>
                  <select required className="at-input at-select" value={editModalData.sub} onChange={e => setEditModalData({...editModalData, sub: e.target.value})}>
                    <option value="">Select Service Type</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
              </div>

              <div className="at-form-row">
                <div className="at-form-group">
                  <label className="at-label">Incharge Name <span className="at-req">*</span></label>
                  <input required type="text" className="at-input" value={editModalData.incharge} onChange={e => setEditModalData({...editModalData, incharge: e.target.value})} placeholder="Incharge Name" />
                </div>
                <div className="at-form-group">
                  <label className="at-label">Phone Number <span className="at-req">*</span></label>
                  <input required type="text" className="at-input" value={editModalData.phone} onChange={e => setEditModalData({...editModalData, phone: e.target.value})} placeholder="Phone Number" />
                </div>
              </div>

              <div className="at-form-group at-full">
                <label className="at-label">City / Zone <span className="at-req">*</span></label>
                <input required type="text" className="at-input" value={editModalData.city} onChange={e => setEditModalData({...editModalData, city: e.target.value})} placeholder="e.g. Karachi / South" />
              </div>

              <button type="submit" className="at-submit-btn" disabled={saving}>
                {saving ? <span className="at-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    Update Company
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="at-overlay" onClick={() => setDeleteConfirmId(null)} style={{ zIndex: 10000 }}>
          <div className="at-modal" style={{ maxWidth: '400px', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="at-modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Delete Company
              </h2>
              <button className="at-close-btn" onClick={() => setDeleteConfirmId(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                Are you sure you want to delete this company? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
