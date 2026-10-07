import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { I } from './icons'
import './WelcomeOperating.css'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


/* ════ WELCOME DISPATCH QUEUE ════ */

// Helper function to get raw zone name (without "Zone" suffix)
const getRawZone = (zone) => {
  if (!zone) return 'North'
  // Remove " Zone" suffix if present for comparison
  return zone.replace(' Zone', '').trim()
}

// Helper function to get zone color
const getZoneColor = (zone) => {
  const rZone = getRawZone(zone).toLowerCase()
  if (rZone === 'north') return '#eef2f6' // slate-100ish
  if (rZone === 'west') return '#dcfce7' // green-100
  if (rZone === 'east') return '#f3e8ff' // purple-100
  if (rZone === 'south') return '#e0f2fe' // sky-100
  return 'transparent'
}

// Helper function to format zone names
const formatZoneName = (zone) => {
  if (!zone) return 'North Zone'
  // If already contains "Zone", return as is
  if (zone.includes('Zone')) return zone
  // Otherwise, append " Zone" to the zone name
  return `${zone} Zone`
}

export default function WelcomeOperating() {
  const [dispatchStates, setDispatch] = useState({})
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 6

  const [formData, setFormData] = useState({
    clientName: '',
    clientContact: '',
    request: '',
    kind: '',
    category: 'First Call',
    zone: 'North',
    priority: 'Normal',
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        console.log('🔵 Fetching requests and companies...')

        const reqResponse = await axios.get('https://webapicoderepo.onrender.com/api/Requests')
        const compResponse = await axios.get('https://webapicoderepo.onrender.com/api/Companies')

        console.log('✅ Requests:', reqResponse.data)
        console.log('✅ Companies:', compResponse.data)

        const raw = Array.isArray(reqResponse.data) ? reqResponse.data : []
        const companiesData = Array.isArray(compResponse.data) ? compResponse.data : []
        // Store all companies with zone info
        setCompanies(companiesData)

        // Map backend Request model fields to display fields
        // Backend fields: requestID, clientRequestNumber, time, date,
        //                 clientName, clientContact, clientRequest, kindOf, category, zone
        const tix = raw.map(r => {
          const timeVal = r.time || r.Time
          const dateVal = r.date || r.Date
          const timeObj = timeVal ? new Date(timeVal) : null
          const dateObj = dateVal ? new Date(dateVal) : null
          const timeDisplay = timeObj
            ? timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : ''
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const dateDisplay = dateObj
            ? `${String(dateObj.getDate()).padStart(2, '0')}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`
            : ''

          const reqID = r.requestID || r.RequestID
          const statVal = r.status || r.Status || 'Open'
          const year = dateObj ? dateObj.getFullYear() : new Date().getFullYear()

          return {
            id: reqID,
            crn: `CR-${year}-${reqID}`,
            crid: `CRID-00${reqID}`,
            request: r.clientRequest || r.ClientRequest || '',
            kind: r.kindOf || r.KindOf || '',
            category: r.category || r.Category || 'First Call',
            zone: formatZoneName(r.zone || r.Zone || 'North'),
            status: statVal,
            statusClass: `status-${statVal.toLowerCase().replace(' ', '-')}`,
            time: timeDisplay,
            date: dateDisplay,
            clientName: r.clientName || r.ClientName || '',
            technicianName: r.technicianName || r.TechnicianName || '',
            companies: companiesData.filter(c => getRawZone(c.zone || c.Zone) === getRawZone(r.zone || r.Zone || 'North'))
              .map(c => ({
                name: c.companyName || c.CompanyName,
                id: c.companyID || c.CompanyID,
                zone: c.zone || c.Zone,
                highlighted: false
              })),
          }
        })

        // Always sort by id descending (newest at the top)
        tix.sort((a, b) => b.id - a.id)
        setTickets(tix)

        const dStates = {}
        tix.forEach(t => {
          dStates[t.crn] = { zone: t.zone, open: false }
        })
        setDispatch(dStates)
      } catch (err) {
        console.error('❌ Axios error:', err.message)
        setTickets([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const now = new Date()
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`

    // Backend RequestCreateDto ke exact fields:
    const backendPayload = {
      clientName: formData.clientName,
      clientContact: formData.clientContact,
      clientRequest: formData.request,
      kindOf: formData.kind,
      category: formData.category,
      zone: formData.zone,
      priority: formData.priority || 'Normal',
      specialInstructions: formData.specialInstructions || '',
      serviceAddress: formData.serviceAddress || '',
    }

    // Frontend display ke liye local ticket object
    const localTicket = {
      crn: 'Saving...',
      crid: '#new',
      request: formData.request,
      kind: formData.kind,
      category: formData.category,
      zone: formData.zone,
      status: 'Open',
      statusClass: 'open',
      time: timeStr,
      date: dateStr,
      clientName: formData.clientName,
      companies: companies.filter(c => getRawZone(c.zone || c.Zone) === getRawZone(formData.zone))
        .map(c => ({
          name: c.companyName || c.CompanyName,
          id: c.companyID || c.CompanyID,
          zone: c.zone || c.Zone,
          highlighted: false
        })),
    }

    try {
      console.log('📤 Sending to backend:', backendPayload)
      const response = await axios.post('https://webapicoderepo.onrender.com/api/Requests', backendPayload)
      console.log('✅ Request created:', response.data)

      const saved = response.data
      const timeObj = saved.time ? new Date(saved.time) : null
      const dateObj = saved.date ? new Date(saved.date) : null
      const months2 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const savedTimeDisplay = timeObj
        ? timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : timeStr
      const savedDateDisplay = dateObj
        ? `${String(dateObj.getDate()).padStart(2, '0')}-${months2[dateObj.getMonth()]}-${dateObj.getFullYear()}`
        : dateStr

      const year = dateObj ? dateObj.getFullYear() : new Date().getFullYear()

      const savedTicket = {
        ...localTicket,
        id: saved.requestID,
        crn: `CR-${year}-${saved.requestID}`,
        crid: `CRID-00${saved.requestID}`,
        time: savedTimeDisplay,
        date: savedDateDisplay,
      }

      setTickets(prev => [savedTicket, ...prev])
      setDispatch(prev => ({
        ...prev,
        [savedTicket.crn]: { zone: savedTicket.zone, open: false }
      }))

      setFormData({
        clientName: '',
        clientContact: '',
        request: '',
        kind: '',
        category: 'First Call',
        zone: 'North',
        priority: 'Normal',
        specialInstructions: '',
        serviceAddress: '',
      })
      setShowRequestForm(false)
      toast.success('New Request Created Successfully!')
    } catch (err) {
      console.error('❌ Full error object:', err)
      if (err.response) {
        console.error('❌ Status:', err.response.status)
        console.error('❌ Response data (full):', JSON.stringify(err.response.data, null, 2))
        const msg = err.response.data?.message ||
          err.response.data?.title ||
          JSON.stringify(err.response.data, null, 2)
        alert(`❌ Failed (${err.response.status}):\n\n${msg}`)
      } else if (err.request) {
        console.error('❌ No response received (CORS or server not running):', err.request)
        alert('No response from server.\n\nPossible causes:\n1. .NET API not running on port 5186\n2. CORS not configured in Program.cs')
      } else {
        console.error('❌ Request setup error:', err.message)
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const d = currentTime;
  const dayString = d.toLocaleDateString('en-US', { weekday: 'long' });
  const timeString = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateString = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tickets.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(tickets.length / recordsPerPage);

  return (
    <div className="welcome-container">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header Banner Control */}
      <div className="welcome-banner">
        <div className="wb-left">
          <div className="wb-title">WELCOME OPERATING CENTRE</div>
          <div className="wb-sub">LIVE REQUEST MONITORING & DISPATCH CONTROL</div>
        </div>
        <div className="wb-cards">
          <div className="wb-card">
            <div className="wbc-ico">{I.calendar}</div>
            <div>
              <div className="wbc-val">{dateString}</div>
              <div className="wbc-lbl">{dayString}</div>
            </div>
          </div>
          <div className="wb-card">
            <div className="wbc-ico">{I.clock}</div>
            <div>
              <div className="wbc-val">{timeString}</div>
              <div className="wbc-lbl">Live Time</div>
            </div>
          </div>

          <div
            className="wb-card wb-card-clickable"
            onClick={() => setShowRequestForm(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="wbc-ico">{I.plus}</div>
            <div>
              <div className="wbc-val">New Request</div>
              <div className="wbc-lbl">Create Ticket</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Poppinsactive Queue Grid */}
      <div className="wq-card">
        <table className="wq-tbl">
          <thead>
            <tr>
              <th className="th-time"><span className="th-cell-wrap">{I.clock}TIME</span></th>
              <th className="th-req"><span className="th-cell-wrap">{I.briefcase}CLIENT REQUEST</span></th>
              <th className="th-kind"><span className="th-cell-wrap">{I.wrench}KIND OF</span></th>
              <th className="th-crn"><span className="th-cell-wrap">{I.clip}COMPLAINT REQUEST NUMBER (CRN)</span></th>
              <th className="th-crid"><span className="th-cell-wrap">{I.userIco}COMPLAINT REQUEST ID (CR ID)</span></th>
              <th className="th-cat"><span className="th-cell-wrap">{I.tag}CATEGORY</span></th>
              <th className="th-action"><span className="th-cell-wrap">{I.cog}ACTION</span></th>
              <th className="th-status"><span className="th-cell-wrap">{I.checkCirc}STATUS</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Loading dispatch tickets...</div>
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#0D4F3C' }}>
                    {I.briefcase}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#002147' }}>
                    No tickets available
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    Create a new request using the "New Request" button above
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Note: Make sure .NET backend server is running on port 5186
                  </div>
                </td>
              </tr>
            ) : currentRecords.map((t) => {
              const dropdownState = dispatchStates[t.crn] || { zone: t.zone, open: false }
              return (
                <tr key={t.crn} className="wq-row" style={{ backgroundColor: getZoneColor(t.zone) }}>
                  <td className="td-time">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span className="w-time" style={{ marginBottom: 0 }}>{t.time}</span>
                      <span className="w-date" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t.date}</span>
                    </div>
                  </td>
                  <td className="td-req font-bold-ob">{t.request}</td>
                  <td className="td-kind">{t.kind}</td>
                  <td className="td-crn font-bold-pg" style={{ whiteSpace: 'nowrap' }}>{t.crn}</td>
                  <td className="td-crid font-medium-ob">{t.crid}</td>
                  <td className="td-cat">
                    <span className={`cat-badge cat-${t.category.toLowerCase().replace(' ', '-')}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="td-action">
                    {['Assigned', 'InProgress', 'In Progress'].includes(t.status) ? (
                      <div style={{ fontWeight: 700, color: '#0d4f3c', fontSize: '12.5px', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
                        {t.technicianName || 'Assigned'}
                      </div>
                    ) : (
                      <div className="action-dispatch-box">
                        <div className="zone-sel-trigger" onClick={() => {
                          setDispatch(prev => ({
                            ...prev,
                            [t.crn]: { ...prev[t.crn], open: !prev[t.crn]?.open }
                          }))
                        }}>
                          <span>{dropdownState.zone}</span>
                          <span className={`z-chev ${dropdownState.open ? 'open' : ''}`}>{I.chevD}</span>
                        </div>

                        <div className={`vendor-matching-panel ${dropdownState.open ? 'expanded' : ''}`}>
                          {t.companies.map((co, cIdx) => (
                            <div key={cIdx}
                              className={`vendor-item${co.highlighted ? ' active-matched' : ''}`}
                              onClick={async () => {
                                try {
                                  await axios.post(`https://webapicoderepo.onrender.com/api/Requests/${t.crn}/award`, {
                                    companyId: co.id,
                                    companyName: co.name,
                                    zone: co.zone || t.zone
                                  })
                                  setDispatch(prev => ({
                                    ...prev,
                                    [t.crn]: { zone: `${co.zone || t.zone} - Selected`, open: false }
                                  }))
                                } catch (err) {
                                  console.error('❌ Award error:', err.message)
                                }
                              }}>
                              <span className="vendor-lbl">{co.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="td-status">
                    <span className={`status-badge-welcome ${t.statusClass}`}>
                      <span className="status-welcome-dot" />
                      {t.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px 20px', gap: 10, alignItems: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginRight: 'auto' }}>
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, tickets.length)} of {tickets.length} requests
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

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="request-modal-overlay" onClick={() => setShowRequestForm(false)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="request-modal-header">
              <h2>NEW REQUEST</h2>
              <button className="modal-close-btn" onClick={() => setShowRequestForm(false)}>
                {I.close}
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="request-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="e.g., Ahmed Al Mansouri"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Client Contact *</label>
                  <input
                    type="tel"
                    name="clientContact"
                    placeholder="e.g., +971 50 123 4567"
                    value={formData.clientContact}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Client Request *</label>
                <input
                  type="text"
                  name="request"
                  placeholder="e.g., Riverside Condo - AC Not Cooling"
                  value={formData.request}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kind Of *</label>
                  <select
                    name="kind"
                    value={formData.kind}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="First Call">First Call</option>
                    <option value="Repeat Call">Repeat Call</option>
                    <option value="VIP Call">VIP Call</option>
                    <option value="Urgent Call">Urgent Call</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Zone *</label>
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="North">North Zone</option>
                    <option value="South">South Zone</option>
                    <option value="East">East Zone</option>
                    <option value="West">West Zone</option>
                    <option value="Central">Central Zone</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Priority <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    name="priority"
                    value={formData.priority || 'Normal'}
                    onChange={handleInputChange}
                    required
                    style={{ background: formData.priority === 'Urgent' ? '#fef2f2' : formData.priority === 'High' ? '#fffbeb' : formData.priority === 'VIP' ? '#f5f3ff' : '#f8fafc' }}
                  >
                    <option value="Normal">🟢 Normal</option>
                    <option value="High">🟡 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                    <option value="VIP">👑 VIP</option>
                  </select>
                </div>
              </div>

              {/* Service Address */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Service Address</label>
                  <input
                    type="text"
                    name="serviceAddress"
                    value={formData.serviceAddress || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. House 12, Street 4, Block B, Gulshan-e-Iqbal"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Special Instructions <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Optional)</span></label>
                  <textarea
                    name="specialInstructions"
                    value={formData.specialInstructions || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. Call before arriving, bring spare parts, gate code: 1234"
                    rows={3}
                    style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
