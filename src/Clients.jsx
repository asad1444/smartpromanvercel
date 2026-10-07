import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Clients.css';
import { I } from './icons';
import './App.jsx'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



export default function Clients() {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 8;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpiRes, requestsRes] = await Promise.all([
          api.getClientsSummary().catch(() => null),
          api.getRequests().catch(() => [])
        ]);
        setKpiData(kpiRes);

        const mapped = (Array.isArray(requestsRes) ? requestsRes : []).map((request) => ({
          id:     request.requestID,
          cid:    `CRID-${String(request.requestID).padStart(6, '0')}`,
          name:   request.clientName    || 'N/A',
          phone:  request.clientContact || 'N/A',
          email:  request.category      || '',
          loc:    request.zone          || 'N/A',
          status: request.clientStatus === 'Suspended' ? 'Suspended' : 'Active',
          color:  '#002147',
        }));
        setClients(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayKpi = kpiData?.kpi || [];

  const displayData = (clients || []).filter(row => {
    const q = search.toLowerCase();
    const matchSearch = !q || (row.name||'').toLowerCase().includes(q) || (row.phone||'').toLowerCase().includes(q) || (row.email||'').toLowerCase().includes(q) || String(row.id || '').toLowerCase().includes(q) || (row.cid||'').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (row.status||'').toLowerCase() === statusFilter.toLowerCase();
    const matchZone   = !zoneFilter   || (row.loc||'').toLowerCase().includes(zoneFilter.toLowerCase());
    return matchSearch && matchStatus && matchZone;
  });

  const totalPages = Math.max(1, Math.ceil(displayData.length / clientsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstClientIndex = (safeCurrentPage - 1) * clientsPerPage;
  const paginatedData = displayData.slice(firstClientIndex, firstClientIndex + clientsPerPage);

  const changePage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#123524';
      case 'Pending': return '#002147';
      case 'Suspended': return '#DC2626';
      default: return '#64748b';
    }
  };

  const handleStatusUpdate = async (row, status) => {
    try {
      await api.updateRequestStatus(row.id, status === 'Suspended' ? 'Suspend' : 'Active');
      setClients(prev => prev.map(client => client.id === row.id ? { ...client, status } : client));
      setActionMenuOpen(null);
      toast.success(status === 'Suspended' ? 'This client suspended successfully' : 'This client activated successfully');
    } catch (err) {
      toast.error('Failed to update client status.');
    }
  };

  const genericLogo = (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 20, height: 20}}>
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );

  return (
    <div className="cl-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* KPI ROW */}
      <div className="cl-kpi-row">
        {displayKpi.map(kpi => (
          <div key={kpi.id} className={`cl-kpi-card type-${kpi.type}`}>
            <div className="cl-kpi-inner">
               <div className="cl-kpi-left">
                 <div className={`cl-kpi-ico bg-${kpi.type}`}>
                   {kpi.icon}
                 </div>
               </div>
               <div className="cl-kpi-right">
                 <div className="cl-kpi-title">
                   <span>{kpi.title}</span><br />
                   {kpi.sub && <span className="cl-kpi-sub">{kpi.sub}</span>}
                 </div>
                 <div className={`cl-kpi-val val-${kpi.type}`}>{kpi.value}</div>
               </div>
            </div>
            <div className={`cl-kpi-bar bar-${kpi.type}`} />
          </div>
        ))}
      </div>

      {/* HEADER FILTERS SECTION */}
      <div className="cl-header-sec">
        <div className="cl-filters-row">
          <div className="cl-search-wrap">
            <span className="cl-search-icon">{I.search}</span>
            <input type="text" placeholder="Search clients..." className="cl-search-input" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>

          <select className="cl-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspend</option>
          </select>
          
          <select className="cl-select" value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All Zones</option>
            <option value="South">South</option>
            <option value="North">North</option>
            <option value="West">West</option>
          </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="cl-table-card">
        <table className="cl-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>CONTACT INFO</th>
              <th>DEFAULT LOCATION / ZONE</th>
              <th>CLIENT STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="cl-prof">
                    <div className="cl-logo">
                       {genericLogo(row.color)}
                    </div>
                    <div>
                      <div className="td-bold" style={{color: '#002147'}}>{row.name}</div>
                      <div className="td-sub">{row.cid}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="td-bold" style={{fontWeight: 500, color: 'var(--t1)'}}>{row.phone}</div>
                  <div className="td-sub" style={{color: '#123524'}}>{row.email}</div>
                </td>
                <td>
                  <div className="cl-loc">
                    <span className="cl-loc-ico">{I.mapPin}</span>
                    <span className="td-bold" style={{fontWeight: 500, color: 'var(--t1)'}}>{row.loc}</span>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: row.status === 'Active' ? '#e8f5ec' : '#ffe4e4', color: getStatusColor(row.status) }}>
                    {row.status}
                  </span>
                </td>
                <td className="cl-action-cell">
                  <button className="cl-action-btn" onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === row.id ? null : row.id); }}>{I.dots}</button>
                  {actionMenuOpen === row.id && (
                    <div className="cl-action-dd" onClick={e => e.stopPropagation()}>
                      <button className="cl-dd-item txt-success" onClick={() => handleStatusUpdate(row, 'Active')}>Active</button>
                      <button className="cl-dd-item txt-danger" onClick={() => handleStatusUpdate(row, 'Suspended')}>Suspend</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* PAGINATION */}
        {displayData.length > 0 && (
          <div className="cl-pagination">
            <div className="pg-info">Showing {firstClientIndex + 1} to {Math.min(firstClientIndex + clientsPerPage, displayData.length)} of {displayData.length} entries</div>
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

      {actionMenuOpen && <div className="cl-overlay-clear" onClick={() => setActionMenuOpen(null)} />}
    </div>
  );
}
