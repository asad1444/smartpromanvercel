import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Technicians.css';
import { I } from './icons';
import './AtModal.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Technicians() {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const techniciansPerPage = 6;
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dataRes, companyRes] = await Promise.all([
          api.getTechnicians(),
          api.getCompanies().catch(() => [])
        ]);

        const companyMap = new Map(
          (Array.isArray(companyRes) ? companyRes : []).map(company => [
            String(company.companyID ?? company.companyId ?? company.id ?? ''),
            company.companyName || company.CompanyName || 'Unknown Company'
          ])
        );
        setCompanyOptions([...companyMap.values()]
          .filter(company => company && company !== 'Unknown Company')
          .sort((a, b) => a.localeCompare(b)));

        const arr = Array.isArray(dataRes) ? dataRes : (dataRes ? [dataRes] : []);
        const mapped = arr.map(t => {
          const companyId = t.companyId ?? t.companyID ?? t.CompanyID ?? t.company_id ?? '';
          const resolvedCompany = t.companyName || t.CompanyName || companyMap.get(String(companyId)) || 'Unknown Company';

          return {
            id: t.technicianID,
            name: t.fullName || '--',
            sub: t.designation || t.approvalStatus || '--',
            tid: `TECH-${t.technicianID}`,
            phone: t.phone || '--',
            comp: resolvedCompany,
            status: t.approvalStatus === 'Suspended' ? 'Suspended' : t.approvalStatus === 'Pending' ? 'Pending' : t.liveStatus === 'OnJob' ? 'On a Job' : t.liveStatus || 'Offline',
            jobs: t.totalJobsSolved ?? 0,
            wallet: t.wallet ? `PKR ${t.wallet}` : 'PKR 0',
            photo: t.photo || null,
            imgStr: t.fullName ? t.fullName.substring(0, 2).toUpperCase() : '--',
            color: '#0D4F3C',
          };
        });

        setTechnicians(mapped);
      } catch (err) {
        console.error('Technicians page load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const displayKpi = [
    { id: 1, type: 'primary', title: 'Total Fleet', value: technicians.length, label: 'All technicians' },
    { id: 2, type: 'success', title: 'Online Now', value: technicians.filter(technician => technician.status === 'Online').length, label: 'Active & available' },
    { id: 3, type: 'warning', title: 'On a Job', value: technicians.filter(technician => technician.status === 'On a Job').length, label: 'Currently working' },
    { id: 4, type: 'offline', title: 'Off Duty', value: technicians.filter(technician => technician.status === 'Offline').length, label: 'Inactive / offline' },
  ];
  const displayData = (technicians || []).filter(row => {
    const q = search.toLowerCase();
    const matchSearch = !q || (row.name || '').toLowerCase().includes(q) || (row.tid || '').toLowerCase().includes(q) || (row.phone || '').toLowerCase().includes(q) || (row.comp || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (row.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchCompany = !companyFilter || (row.comp || '').toLowerCase().includes(companyFilter.toLowerCase());
    return matchSearch && matchStatus && matchCompany;
  });

  const totalPages = Math.max(1, Math.ceil(displayData.length / techniciansPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstTechnicianIndex = (safeCurrentPage - 1) * techniciansPerPage;
  const paginatedData = displayData.slice(firstTechnicianIndex, firstTechnicianIndex + techniciansPerPage);

  const changePage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online':
        return '#123524';
      case 'Offline':
        return '#0ea5e9';
      case 'On a Job':
        return '#f59e0b';
      case 'Suspended':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const handleStatusUpdate = async (row, nextStatus) => {
    try {
      const apiStatus = nextStatus === 'Suspended' ? 'Suspend' : nextStatus === 'Online' ? 'Approval' : 'Pending';
      await api.updateTechnicianStatus(row.id, { status: apiStatus });
      setTechnicians(prev => prev.map(item => item.id === row.id ? { ...item, status: nextStatus } : item));
      setActionMenuOpen(null);
      toast.success(nextStatus === 'Suspended' ? 'This technician suspended successfully' : 'Technician status updated successfully');
    } catch (err) {
      console.error('Failed to update technician status:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openTechnicianProfile = async (row, edit = false) => {
    try {
      const detail = await api.getTechnicianById(row.id);
      if (edit) setEditData(detail);
      else setProfileData(detail);
      setActionMenuOpen(null);
    } catch (err) {
      toast.error('Unable to load technician details.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData) return;
    setSaving(true);
    try {
      const technicianId = editData.technicianID ?? editData.TechnicianID;
      const payload = {
        fullName: editData.fullName ?? editData.FullName,
        email: editData.email ?? editData.Email,
        phone: editData.phone ?? editData.Phone,
        designation: editData.designation ?? editData.Designation,
        photo: editData.photo ?? editData.Photo,
      };
      await api.updateTechnician(technicianId, payload);
      setTechnicians(prev => prev.map(item => item.id === technicianId ? {
        ...item,
        name: payload.fullName,
        phone: payload.phone,
        sub: payload.designation,
      } : item));
      setEditData(null);
      toast.success('Technician updated successfully');
    } catch (err) {
      let message = err.message || 'Failed to update technician.';
      try {
        const parsed = JSON.parse(message);
        message = parsed.message || parsed.title || message;
      } catch {
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.deleteTechnician(deleteConfirmId);
      setTechnicians(prev => prev.filter(item => item.id !== deleteConfirmId));
      toast.success('Technician deleted successfully');
    } catch (err) {
      toast.error('Failed to delete technician.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  if (loading && technicians.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '600px', backgroundColor: '#f8fafc' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#002147', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 16, fontWeight: 500, fontFamily: 'Poppins, sans-serif' }}>Loading Technicians...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="tech-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="tech-kpi-row">
        {displayKpi.map(kpi => (
          <div key={kpi.id} className={`tech-kpi-card type-${kpi.type}`}>
            <div className="tech-kpi-inner">
              <div className="tech-kpi-left">
                <div className={`tech-kpi-ico bg-${kpi.type}`}>
                  {kpi.icon || I.users}
                </div>
              </div>
              <div className="tech-kpi-right">
                <div className="tech-kpi-title">
                  {kpi.title}
                  {kpi.hasDot && <span className={`tech-kpi-dot dot-${kpi.type}`} />}
                </div>
                <div className="tech-kpi-val">{kpi.value}</div>
                <div className="tech-kpi-lbl" style={{ color: kpi.labelColor || '' }}>{kpi.label}</div>
              </div>
            </div>
            <div className={`tech-kpi-bar bar-${kpi.type}`} />
          </div>
        ))}
      </div>

      <div className="tech-header-sec">
        <div className="tech-filters-row">
          <div className="tech-search-wrap">
            <span className="tech-search-icon">{I.search}</span>
            <input type="text" placeholder="Search technician..." className="tech-search-input" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>

          <select className="tech-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Status</option>
            <option value="online">Online</option>
            <option value="on a job">On a Job</option>
            <option value="offline">Offline</option>
            <option value="suspended">Suspended</option>
          </select>

          <select className="tech-select" value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Companies</option>
            {companyOptions.map(company => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tech-table-card">
        <table className="tech-table">
          <thead>
            <tr>
              <th>TECHNICIAN PROFILE</th>
              <th>TECHNICIAN ID</th>
              <th>CONTACT NUMBER</th>
              <th>COMPANY</th>
              <th>LIVE STATUS</th>
              <th>TOTAL JOBS SOLVED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>Loading technicians...</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>No technicians found.</td></tr>
            ) : paginatedData.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="tech-prof">
                    <div className="tech-logo" style={{ background: row.color }}>
                      {row.photo ? (
                        <img src={row.photo} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        row.imgStr
                      )}
                      <span className="tech-st-dot" style={{ background: getStatusColor(row.status) }} />
                    </div>
                    <div>
                      <div className="td-bold">{row.tid}</div>
                      <div className="td-sub">{row.name}</div>
                    </div>
                  </div>
                </td>
                <td><div className="td-bold">{row.tid}</div></td>
                <td><div className="td-bold">{row.phone}</div></td>
                <td><div className="td-sub" style={{ color: 'var(--t1)' }}>{row.comp}</div></td>
                <td>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px',
                    borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: row.status === 'Online' ? '#e8f5ec' : row.status === 'On a Job' ? '#fff7e6' : '#f1f5f9',
                    color: getStatusColor(row.status)
                  }}>{row.status}</span>
                </td>
                <td><div className="td-sub" style={{ color: 'var(--t1)' }}>{row.jobs}</div></td>
                <td className="tech-action-cell">
                  <button className="tech-action-btn" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === row.id ? null : row.id); }}>{I.dots}</button>
                  {actionMenuOpen === row.id && (
                    <div className="tech-action-dd" onClick={e => e.stopPropagation()}>
                      <button className="tech-dd-item" onClick={() => openTechnicianProfile(row)}>
                        <span className="dd-ico">{I.eye}</span>View Profile
                      </button>
                      <button className="tech-dd-item" onClick={() => openTechnicianProfile(row, true)}>
                        <span className="dd-ico">{I.edit}</span>Edit Profile
                      </button>
                      <div className="dd-sep" />
                      <button className="tech-dd-item txt-danger" onClick={() => handleStatusUpdate(row, 'Suspended')}>
                        <span className="dd-ico">{I.xCirc}</span>Suspend
                      </button>
                      <div className="dd-sep" />
                      <button className="tech-dd-item txt-danger" onClick={() => { setDeleteConfirmId(row.id); setActionMenuOpen(null); }}>
                        <span className="dd-ico">{I.trash}</span>Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayData.length > 0 && (
          <div className="tech-pagination">
            <div className="pg-info">Showing {firstTechnicianIndex + 1} to {Math.min(firstTechnicianIndex + techniciansPerPage, displayData.length)} of {displayData.length} entries</div>
            <div className="pg-controls">
              <button className="pg-btn pg-nav-btn" onClick={() => changePage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1}>Previous</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button key={page} className={`pg-btn ${safeCurrentPage === page ? 'active' : ''}`} onClick={() => changePage(page)}>{page}</button>
              ))}
              <button className="pg-btn pg-nav-btn" onClick={() => changePage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>

      {actionMenuOpen && <div className="tech-overlay-clear" onClick={() => setActionMenuOpen(null)} />}

      {deleteConfirmId && (
        <div className="tech-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="tech-modal tech-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="tech-modal-header">
              <h2>Delete Technician</h2>
              <button type="button" onClick={() => setDeleteConfirmId(null)}>×</button>
            </div>
            <p>Are you sure you want to delete this technician? This action cannot be undone.</p>
            <div className="tech-delete-actions">
              <button type="button" className="tech-cancel-btn" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button type="button" className="tech-delete-btn" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {profileData && (
        <div className="at-overlay" onClick={() => setProfileData(null)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <div className="at-modal-brand">
                <div className="at-modal-logo">SPM</div>
              </div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">View Technician</h2>
                <p className="at-modal-sub">Technician details</p>
              </div>
              <button className="at-close-btn" type="button" onClick={() => setProfileData(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="tech-view-content">
              <div className="tech-view-identity">
                <div className="tech-view-avatar">
                  {profileData.photo ? <img src={profileData.photo} alt={profileData.fullName || 'Technician'} /> : <span>{(profileData.fullName || '--').substring(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <h3>{profileData.fullName || '--'}</h3>
                  <p>{profileData.designation || 'Technician'}</p>
                </div>
              </div>

              <div className="tech-view-grid">
                <div className="tech-view-card"><span>EMAIL ADDRESS</span><strong>{profileData.email || '--'}</strong></div>
                <div className="tech-view-card"><span>PHONE NUMBER</span><strong>{profileData.phone || '--'}</strong></div>
                <div className="tech-view-card"><span>COMPANY</span><strong>{profileData.companyName || '--'}</strong></div>
                <div className="tech-view-card"><span>STATUS</span><strong>{profileData.approvalStatus || profileData.liveStatus || '--'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editData && (
        <div className="at-overlay" onClick={() => setEditData(null)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            <div className="at-modal-header">
              <div className="at-modal-brand"><div className="at-modal-logo">SPM</div></div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">Edit Technician</h2>
                <p className="at-modal-sub">Update technician information</p>
              </div>
              <button className="at-close-btn" type="button" onClick={() => setEditData(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className="at-form" onSubmit={handleEditSubmit}>
              <div className="at-form-row">
                <div className="at-form-group"><label className="at-label">Full Name <span className="at-req">*</span></label><input className="at-input" value={editData.fullName || ''} onChange={e => setEditData({ ...editData, fullName: e.target.value })} required /></div>
                <div className="at-form-group"><label className="at-label">Designation <span className="at-req">*</span></label><input className="at-input" value={editData.designation || ''} onChange={e => setEditData({ ...editData, designation: e.target.value })} required /></div>
              </div>
              <div className="at-form-row">
                <div className="at-form-group"><label className="at-label">Email <span className="at-req">*</span></label><input className="at-input" type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} required /></div>
                <div className="at-form-group"><label className="at-label">Phone <span className="at-req">*</span></label><input className="at-input" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} required /></div>
              </div>
              <button className="at-submit-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
