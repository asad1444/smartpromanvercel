import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Foremen.css';
import { I } from './icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ── Eye Icon ──────────────────────────────────────────────────────────────────
const EyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const EyeOn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const INITIAL_FORM = {
  fullName: '', email: '', phone: '', cnic: '',
  password: '', confirmPassword: ''
};

export default function Foremen() {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [foremen, setForemen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const foremenPerPage = 8;
  
  // Add Foreman Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [formOk, setFormOk] = useState('');

  // Assign Job Modal
  const [assignModalTech, setAssignModalTech] = useState(null);
  const [openJobs, setOpenJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      if (api.getForemen) {
        const [foremenRes, companiesRes] = await Promise.all([
          api.getForemen().catch(() => []),
          api.getCompanies().catch(() => [])
        ]);
        const list = Array.isArray(foremenRes) ? foremenRes : (foremenRes ? [foremenRes] : []);
        const companies = Array.isArray(companiesRes) ? companiesRes : [];
        const companyMap = new Map(companies.map(company => [
          String(company.companyID ?? company.companyId ?? company.id ?? ''),
          company.zone || company.Zone || company.city || company.City || '--'
        ]));
        setForemen(list.filter(t => (t.designation || t.Designation) === 'Foreman').map(t => ({
          ...t,
          id: t.technicianID ?? t.TechnicianID,
          status: (t.approvalStatus || t.ApprovalStatus) === 'Suspended' ? 'Suspended' : 'Active',
          city: t.zone || t.Zone || t.city || t.City || companyMap.get(String(t.companyID ?? t.CompanyID ?? '')) || '--',
          name: t.fullName || t.FullName || '--',
          sub: t.designation || t.Designation || 'Foreman',
          phone: t.phone || t.Phone || '--',
          jobs: t.totalJobsSolved ?? t.TotalJobsSolved ?? 0,
        })));
      } else {
        setForemen([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddForeman = async (e) => {
    e.preventDefault();
    setFormErr('');
    setFormOk('');

    if (!form.fullName.trim()) return setFormErr('Full name is required');
    if (!form.phone.trim()) return setFormErr('Phone number is required');
    
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      return setFormErr('You Can fill Only 11 Digits Number');
    }

    if (!form.cnic.trim()) return setFormErr('CNIC is required');
    if (form.password.length < 6) return setFormErr('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setFormErr('Passwords do not match');

    setSaving(true);
    try {
      await api.addCompanyTechnician(1, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        cnic: form.cnic.replace(/-/g, ''),
        password: form.password,
        confirmPassword: form.confirmPassword,
        designation: 'Foreman',
      });
      toast.success(`Foreman ${form.fullName} Added Successfully`);
      setFormOk('✅ Foreman added successfully!');
      setForm(INITIAL_FORM);
      loadData();
      setTimeout(() => { setShowAddModal(false); setFormOk(''); }, 1500);
    } catch (err) {
      toast.error('Failed to add foreman');
      setFormErr('Failed to add foreman.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (row, nextStatus) => {
    try {
      const apiStatus = nextStatus === 'Suspended' ? 'Suspend' : 'Approval';
      await api.updateTechnicianStatus(row.id, { status: apiStatus });
      setForemen(prev => prev.map(item => item.id === row.id ? { ...item, status: nextStatus } : item));
      setActionMenuOpen(null);
      toast.success(nextStatus === 'Suspended' ? 'This foreman suspended successfully' : 'This foreman activated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update foreman status.');
    }
  };

  const openAssignModal = async (foreman) => {
    if (foreman.status === 'Suspended') {
      toast.error('Suspended foreman cannot receive jobs. Activate the foreman first.');
      return;
    }
    setAssignModalTech(foreman);
    setActionMenuOpen(null);
    setSelectedJob('');
    try {
      const res = await api.getRequests();
      const raw = Array.isArray(res) ? res : (res?.requests ? res.requests : []);
      // Show requests that do not yet have a Job/foreman assignment.
      const openReqs = raw.filter(r => {
        const status = (r.status || r.Status || 'Open').toLowerCase();
        const hasJob = r.jobID || r.JobID;
        return !hasJob && status !== 'assigned';
      });
      setOpenJobs(openReqs);
    } catch (err) {
      toast.error('Failed to load open jobs');
    }
  };

  const handleAssignJob = async () => {
    if (!selectedJob) return;
    setAssignLoading(true);
    try {
      const job = openJobs.find(j => (j.requestID || j.RequestID).toString() === selectedJob);
      const jobId = job.requestID || job.RequestID;
      const foremanId = assignModalTech.id || assignModalTech.technicianID || assignModalTech.TechnicianID;
      await api.assignForemanToRequest(jobId, foremanId);
      toast.success(`Job assigned to ${assignModalTech.name || assignModalTech.fullName} Successfully`);
      setAssignModalTech(null);
      setSelectedJob('');
    } catch (err) {
      let message = err.message || 'Failed to assign job';
      try {
        const parsed = JSON.parse(message);
        message = parsed.message || parsed.title || message;
      } catch {
      }
      toast.error(message);
    } finally {
      setAssignLoading(false);
    }
  };

  const displayData = (foremen || []).filter(row => {
    const q = search.toLowerCase();
    const matchSearch = !q || (row.name||row.fullName||'').toLowerCase().includes(q) || (row.incharge||'').toLowerCase().includes(q) || (row.phone||'').toLowerCase().includes(q) || (row.city||'').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (row.status||'').toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(displayData.length / foremenPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstForemanIndex = (safeCurrentPage - 1) * foremenPerPage;
  const paginatedData = displayData.slice(firstForemanIndex, firstForemanIndex + foremenPerPage);
  const changePage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  return (
    <div className="foremen-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* HEADER FILTERS SECTION */}
      <div className="foremen-header-sec">
        <div className="foremen-filters-row">
          <div className="foremen-search-wrap">
            <span className="foremen-search-icon">{I.search}</span>
            <input type="text" placeholder="Search foreman..." className="foremen-search-input" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          
          <select className="foremen-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspend</option>
          </select>
          
          <button className="foremen-btn-primary" onClick={() => { setForm(INITIAL_FORM); setFormErr(''); setFormOk(''); setShowAddModal(true); }}>
            <span className="add-usr-ico" style={{ marginRight: '8px', display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </span>
            Add Foreman
          </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="foremen-table-card">
        <table className="foremen-table">
          <thead>
            <tr>
              <th>Foremen Profile</th>
              <th>Contact Number</th>
              <th>Status</th>
              <th>Jobs Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#64748b'}}>Loading foremen...</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No foremen found. Click "Add Foreman" to add one.</td></tr>
            ) : paginatedData.map((row) => (
              <tr key={row.id || row.technicianID}>
                <td>
                  <div className="foremen-prof">
                    <div className="foremen-logo">
                       {row.fullName ? row.fullName.substring(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <div>
                      <div className="td-bold">{row.name || row.fullName}</div>
                      <div className="td-sub">{row.sub || row.designation || 'Foreman'}</div>
                    </div>
                  </div>
                </td>
                <td><div className="td-bold">{row.phone || row.phoneNumber || row.Phone || 'N/A'}</div></td>
                <td><span className={`foremen-status ${row.status === 'Suspended' ? 'is-suspended' : 'is-active'}`}>{row.status}</span></td>
                <td><div className="td-bold">{row.jobs || row.totalJobsSolved || 0}</div></td>
                <td className="foremen-action-cell">
                  <button className="foremen-action-btn" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === (row.id || row.technicianID) ? null : (row.id || row.technicianID)); }}>{I.dots}</button>
                  {actionMenuOpen === (row.id || row.technicianID) && (
                    <div className="foremen-action-dd" onClick={e => e.stopPropagation()}>
                       {row.status !== 'Suspended' && (
                        <button className="foremen-dd-item" style={{ color: '#0d4f3c', fontWeight: 700 }} onClick={() => openAssignModal(row)}>
                          <span className="dd-ico" style={{ color: '#0d4f3c' }}>{I.briefcase}</span>
                          Assign Job
                        </button>
                       )}
                      <div className="dd-sep" />
                      <button className="foremen-dd-item" style={{ color: '#1e293b', fontWeight: 700 }} onClick={() => handleStatusUpdate(row, 'Active')}>
                         <span className="dd-ico" style={{ color: '#1e293b' }}>{I.checkCirc}</span>
                         Active
                      </button>
                      <button className="foremen-dd-item" style={{ color: '#DC2626', fontWeight: 700 }} onClick={() => handleStatusUpdate(row, 'Suspended')}>
                         <span className="dd-ico" style={{ color: '#DC2626' }}>{I.xCirc}</span>
                         Suspend
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
          <div className="foremen-pagination">
            <div className="pg-info">Showing {firstForemanIndex + 1} to {Math.min(firstForemanIndex + foremenPerPage, displayData.length)} of {displayData.length} entries</div>
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

      {actionMenuOpen && <div className="foremen-overlay-clear" onClick={() => setActionMenuOpen(null)} />}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD FOREMAN MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="at-overlay" onClick={() => setShowAddModal(false)}>
          <div className="at-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="at-modal-header">
              <div className="at-modal-brand">
                <div className="at-modal-logo">SPM</div>
              </div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">Add Foreman</h2>
                <p className="at-modal-sub">Register a new foreman for the platform</p>
              </div>
              <button className="at-close-btn" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Alerts */}
            {formErr && (
              <div className="at-alert at-alert-err">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {formErr}
              </div>
            )}
            {formOk && (
              <div className="at-alert at-alert-ok">
                <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {formOk}
              </div>
            )}

            <form className="at-form" onSubmit={handleAddForeman}>
              {/* Row 1: Full Name + Email */}
              <div className="at-form-row">
                <div className="at-form-group">
                  <label className="at-label">Full Name <span className="at-req">*</span></label>
                  <input
                    type="text" name="fullName" className="at-input"
                    value={form.fullName} onChange={e => { setForm({ ...form, fullName: e.target.value }); setFormErr(''); }}
                    placeholder="e.g. Ahmed Khan" autoComplete="name"
                  />
                </div>
                <div className="at-form-group">
                  <label className="at-label">Email Address <span style={{fontSize:'11px',color:'#94a3b8'}}>(Optional)</span></label>
                  <input
                    type="email" name="email" className="at-input"
                    value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setFormErr(''); }}
                    placeholder="e.g. foreman@example.com" autoComplete="email"
                  />
                </div>
              </div>

              {/* Row 2: Phone + CNIC */}
              <div className="at-form-row">
                <div className="at-form-group">
                  <label className="at-label">Phone Number <span className="at-req">*</span></label>
                  <input
                    type="tel" name="phone" className="at-input"
                    value={form.phone} onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm({ ...form, phone: val }); 
                      setFormErr(''); 
                    }}
                    placeholder="e.g. 03001234567" autoComplete="tel"
                  />
                </div>
                <div className="at-form-group">
                  <label className="at-label">CNIC <span className="at-req">*</span></label>
                  <input
                    type="text" name="cnic" className="at-input"
                    value={form.cnic} onChange={e => { 
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 5 && val.length <= 12) {
                        val = val.slice(0, 5) + '-' + val.slice(5);
                      } else if (val.length > 12) {
                        val = val.slice(0, 5) + '-' + val.slice(5, 12) + '-' + val.slice(12, 13);
                      }
                      setForm({ ...form, cnic: val }); 
                      setFormErr(''); 
                    }}
                    placeholder="e.g. 42101-1234567-1" maxLength={15}
                  />
                </div>
              </div>

              {/* Row 3: Password + Confirm */}
              <div className="at-form-row">
                <div className="at-form-group">
                  <label className="at-label">Password <span className="at-req">*</span></label>
                  <div className="at-pass-wrap">
                    <input
                      type={showPass ? 'text' : 'password'} name="password" className="at-input"
                      value={form.password} onChange={e => { setForm({ ...form, password: e.target.value }); setFormErr(''); }}
                      placeholder="Min 6 characters" autoComplete="new-password"
                    />
                    <button type="button" className="at-eye-btn" onClick={() => setShowPass(p => !p)}>
                      {showPass ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                </div>
                <div className="at-form-group">
                  <label className="at-label">Confirm Password <span className="at-req">*</span></label>
                  <div className="at-pass-wrap">
                    <input
                      type={showConf ? 'text' : 'password'} name="confirmPassword" className="at-input"
                      value={form.confirmPassword} onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); setFormErr(''); }}
                      placeholder="Re-enter password" autoComplete="new-password"
                    />
                    <button type="button" className="at-eye-btn" onClick={() => setShowConf(p => !p)}>
                      {showConf ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="at-submit-btn" disabled={saving}>
                {saving ? <span className="at-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Add Foreman
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ASSIGN JOB MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {assignModalTech && (
        <div className="at-overlay" onClick={() => !assignLoading && setAssignModalTech(null)}>
          <div className="at-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            {/* Modal Header */}
            <div className="at-modal-header" style={{ marginBottom: '16px' }}>
              <div className="at-modal-brand">
                <div className="at-modal-logo">SPM</div>
              </div>
              <div className="at-modal-title-wrap">
                <h2 className="at-modal-title">Assign Job to {assignModalTech.name || assignModalTech.fullName}</h2>
                <p className="at-modal-sub">Select an open request to assign to this foreman.</p>
              </div>
              <button className="at-close-btn" onClick={() => setAssignModalTech(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label className="at-label" style={{ marginBottom: '6px', display: 'block' }}>Available Jobs</label>
              <select className="at-input at-select" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                <option value="">-- Select a Job --</option>
                {openJobs.map(j => (
                  <option key={j.requestID || j.RequestID} value={j.requestID || j.RequestID}>
                    {j.clientName || j.ClientName || 'Unknown Client'} - {j.clientRequest || j.ClientRequest || 'No request details'}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAssignModalTech(null)} disabled={assignLoading} className="at-submit-btn" style={{ background: '#f1f5f9', color: '#475569', boxShadow: 'none' }}>
                Cancel
              </button>
              <button onClick={handleAssignJob} disabled={assignLoading || !selectedJob} className="at-submit-btn">
                {assignLoading ? <span className="at-spinner" /> : 'Assign Job'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
