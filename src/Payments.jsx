import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Payments.css';
import { I } from './icons';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 8;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getPayments();
        setPayments(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalAmount = payments.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  // Cash = 1, Online = 2
  const totalCash = payments.filter(p => p.paymentMethod === 1).reduce((sum, p) => sum + (p.amountReceived || 0), 0);
  const totalOnline = payments.filter(p => p.paymentMethod === 2).reduce((sum, p) => sum + (p.amountReceived || 0), 0);

  const kpiData = [
    { id: 'total', title: 'TOTAL PAYMENTS', value: `${totalAmount.toFixed(2)}`, type: 'primary', icon: I.dashboard },
    { id: 'cash', title: 'CASH PAYMENTS', value: `${totalCash.toFixed(2)}`, type: 'success', icon: I.card },
    { id: 'online', title: 'ONLINE PAYMENTS', value: `${totalOnline.toFixed(2)}`, type: 'warning', icon: I.card }
  ];

  const displayData = payments.filter(row => {
    const q = search.toLowerCase();
    const crMatch = (row.crNumber || '').toLowerCase().includes(q);
    const clientMatch = (row.clientName || '').toLowerCase().includes(q);
    const techMatch = (row.technicianName || '').toLowerCase().includes(q);
    return !q || crMatch || clientMatch || techMatch;
  });

  const totalPages = Math.max(1, Math.ceil(displayData.length / paymentsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstPaymentIndex = (safeCurrentPage - 1) * paymentsPerPage;
  const paginatedData = displayData.slice(firstPaymentIndex, firstPaymentIndex + paymentsPerPage);
  const changePage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const getMethodColor = (method) => {
    return method === 1 ? '#16A34A' : '#EA580C'; // Cash (Green) vs Online (Orange)
  };

  const getMethodName = (method) => {
    return method === 1 ? 'Cash' : 'Online';
  };

  return (
    <div className="pay-container">
      
      {/* KPI ROW */}
      <div className="pay-kpi-row">
        {kpiData.map(kpi => (
          <div key={kpi.id} className={`pay-kpi-card type-${kpi.type}`}>
            <div className="pay-kpi-inner">
              <div className="pay-kpi-left">
                <div className={`pay-kpi-ico bg-${kpi.type}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="pay-kpi-right">
                <div className="pay-kpi-title">
                  {kpi.title}
                </div>
                <div className="pay-kpi-val">{kpi.value}</div>
              </div>
            </div>
            <div className={`pay-kpi-bar bar-${kpi.type}`} />
          </div>
        ))}
      </div>

      <div className="pay-header-sec">
        <div className="pay-filters-row">
          <div className="pay-search-wrap">
            <span className="pay-search-icon">{I.search}</span>
            <input 
              type="text" 
              placeholder="Search CR No, Client, Tech..." 
              className="pay-search-input" 
              value={search} 
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
            />
          </div>
        </div>
      </div>

      <div className="pay-table-card">
        <table className="pay-table">
          <thead>
            <tr>
              <th>CR NUMBER</th>
              <th>CLIENT</th>
              <th>TECHNICIAN</th>
              <th>DATE</th>
              <th>METHOD</th>
              <th className="align-right">AMOUNT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontFamily: 'Poppins,sans-serif' }}>Loading payments...</td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontFamily: 'Poppins,sans-serif' }}>No payments found.</td></tr>
            ) : (
              paginatedData.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="pay-prof">
                      <div>
                        <div className="td-bold">{p.crNumber || 'N/A'}</div>
                        <div className="td-sub">Invoice #{p.invoiceNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="td-bold">{p.clientName || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="td-bold">{p.technicianName || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="td-bold">{new Date(p.paymentDate).toLocaleDateString()}</div>
                    <div className="td-sub">{new Date(p.paymentDate).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px',
                      borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: p.paymentMethod === 1 ? '#e6f4ea' : '#FFEDD5',
                      color: getMethodColor(p.paymentMethod)
                    }}>
                      {getMethodName(p.paymentMethod)}
                    </span>
                  </td>
                  <td className="align-right">
                    <div className="td-bold" style={{ color: 'var(--t1)' }}>
                      {p.amountReceived?.toFixed(2)}
                    </div>
                  </td>
                  <td>
                     <span style={{
                      display: 'inline-block', padding: '3px 10px',
                      borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: p.isSuccessful ? '#e6f4ea' : '#fee2e2',
                      color: p.isSuccessful ? '#16A34A' : '#DC2626'
                    }}>
                      {p.isSuccessful ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {displayData.length > 0 && (
          <div className="pay-pagination">
            <div className="pg-info">Showing {firstPaymentIndex + 1} to {Math.min(firstPaymentIndex + paymentsPerPage, displayData.length)} of {displayData.length} entries</div>
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
    </div>
  );
}
