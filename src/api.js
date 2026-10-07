import axios from 'axios';

// In development, proxy handles the API calls (empty BASE_URL means relative paths)
// In production, use the full API URL from env variable
export const BASE_URL = import.meta.env.VITE_API_URL || '';

const request = async (endpoint, options = {}) => {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  // If BASE_URL is empty (dev mode with proxy), use relative path
  // Otherwise use full URL (production)
  const url = BASE_URL ? `${BASE_URL}${endpoint}` : endpoint;
        
  const { body, ...restOptions } = options;
        
  try {
    const response = await axios({
      url,
      ...restOptions,
      data: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers
    });
    return response.data;
  } catch (error) {
    console.error('API Request Error:', {
      url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response) {
      const errorMsg = typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
      throw new Error(errorMsg || error.message);
    }
    throw error;
  }
};

export const api = {
  // 1. Dashboard
  getDashboardKpi: () => request('/api/Dashboard/kpi'),
  getDashboardCharts: () => request('/api/Dashboard/charts'),
  getDashboardLiveMap: () => request('/api/Dashboard/live-map'),
  getDashboardLiveJobs: () => request('/api/Dashboard/live-jobs'),

  // 2. Dispatch
  getDispatchTickets: () => request('/api/Dispatch/tickets'),
  createDispatchTicket: (ticketData) => request('/api/Dispatch/tickets', { method: 'POST', body: ticketData }),
  getMatchingCompanies: (jobId) => request(`/api/Dispatch/${jobId}/matching-companies`),
  createDispatchBid: (bidData) => request('/api/Dispatch/bids', { method: 'POST', body: bidData }),
  awardJob: (jobId, companyId) => request(`/api/Dispatch/${jobId}/award`, { method: 'POST', body: { companyId } }),

  // 2b. Requests (Welcome Operating)
  getRequests: () => request('/api/Requests'),
  createRequest: (requestData) => request('/api/Requests', { method: 'POST', body: requestData }),
  getRequestById: (id) => request(`/api/Requests/${id}`),
  updateRequest: (id, requestData) => request(`/api/Requests/${id}`, { method: 'PUT', body: requestData }),
  updateRequestStatus: (id, status) => request(`/api/Requests/${id}/status`, { method: 'PUT', body: status }),
  assignForemanToRequest: (id, technicianId) => request(`/api/Requests/${id}/assign-foreman`, { method: 'POST', body: technicianId }),
  deleteRequest: (id) => request(`/api/Requests/${id}`, { method: 'DELETE' }),

  // 3. Clients
  getClients: () => request('/api/Clients'),
  getClientById: (id) => request(`/api/Clients/${id}`),
  createClient: (clientData) => request('/api/Clients', { method: 'POST', body: clientData }),
  updateClient: (id, clientData) => request(`/api/Clients/${id}`, { method: 'PUT', body: clientData }),
  deleteClient: (id) => request(`/api/Clients/${id}`, { method: 'DELETE' }),

  // 4. Companies
  getCompanies: () => request('/api/Companies'),
  getCompanyById: (id) => request(`/api/Companies/${id}`),
  createCompany: (companyData) => request('/api/Companies', { method: 'POST', body: companyData }),
  updateCompany: (id, companyData) => request(`/api/Companies/${id}`, { method: 'PUT', body: companyData }),
  deleteCompany: (id) => request(`/api/Companies/${id}`, { method: 'DELETE' }),

  // 5. Technicians
  getTechnicians: () => request('/api/Technicians'),
  getTechnicianLocations: () => request('/api/Tracking/technicians'),
  
  // Payments
  getPayments: () => request('/api/Payments'),
  getTechnicianById: (id) => request(`/api/Technicians/${id}`),
  createTechnician: (techData) => request('/api/Technicians', { method: 'POST', body: techData }),
  addCompanyTechnician: (companyId, techData) => request(`/api/Company/${companyId}/CompanyTechnician/add`, { method: 'POST', body: techData }),
  updateTechnician: (id, techData) => request(`/api/Technicians/${id}`, { method: 'PUT', body: techData }),
  deleteTechnician: (id) => request(`/api/Technicians/${id}`, { method: 'DELETE' }),

  // 6. DailyWorkReports
  getDailyWorkReports: () => request('/api/DailyWorkReports/search'),
  getDailyWorkReportById: (id) => request(`/api/DailyWorkReports/${id}`),
  createDailyWorkReport: (reportData) => request('/api/DailyWorkReports', { method: 'POST', body: reportData }),
  updateDailyWorkReport: (id, reportData) => request(`/api/DailyWorkReports/${id}`, { method: 'PUT', body: reportData }),
  deleteDailyWorkReport: (id) => request(`/api/DailyWorkReports/${id}`, { method: 'DELETE' }),

  // 7. Invoices
  getInvoices: () => request('/api/Invoices'),
  getInvoiceById: (id) => request(`/api/Invoices/${id}`),
  createInvoice: (invoiceData) => request('/api/Invoices', { method: 'POST', body: invoiceData }),
  updateInvoice: (id, invoiceData) => request(`/api/Invoices/${id}`, { method: 'PUT', body: invoiceData }),
  deleteInvoice: (id) => request(`/api/Invoices/${id}`, { method: 'DELETE' }),

  // 8. JobMessages
  getJobMessages: () => request('/api/JobMessages'),
  getJobMessageById: (id) => request(`/api/JobMessages/${id}`),
  sendJobMessage: (messageData) => request('/api/JobMessages', { method: 'POST', body: messageData }),
  deleteJobMessage: (id) => request(`/api/JobMessages/${id}`, { method: 'DELETE' }),

  // 9. JobStuckHistory
  getJobStuckHistory: () => request('/api/JobStuckHistory'),
  getJobStuckHistoryById: (id) => request(`/api/JobStuckHistory/${id}`),
  createJobStuckHistory: (historyData) => request('/api/JobStuckHistory', { method: 'POST', body: historyData }),

  // 10. MasterCards
  getMasterCards: () => request('/api/MasterCards'),
  getJobTracker: (jobId) => request(`/api/technician/job-status/${jobId}/tracker`),
  getMasterCardById: (id) => request(`/api/MasterCards/${id}`),
  createMasterCard: (cardData) => request('/api/MasterCards', { method: 'POST', body: cardData }),
  updateMasterCard: (id, cardData) => request(`/api/MasterCards/${id}`, { method: 'PUT', body: cardData }),
  deleteMasterCard: (id) => request(`/api/MasterCards/${id}`, { method: 'DELETE' }),

  // 11. Notifications
  getNotifications: () => request('/api/Notifications'),
  getNotificationById: (id) => request(`/api/Notifications/${id}`),
  sendNotification: (notifData) => request('/api/Notifications', { method: 'POST', body: notifData }),
  deleteNotification: (id) => request(`/api/Notifications/${id}`, { method: 'DELETE' }),

  // 12. Payments
  getPayments: () => request('/api/Payments'),
  getPaymentById: (id) => request(`/api/Payments/${id}`),
  createPayment: (paymentData) => request('/api/Payments', { method: 'POST', body: paymentData }),
  updatePayment: (id, paymentData) => request(`/api/Payments/${id}`, { method: 'PUT', body: paymentData }),
  deletePayment: (id) => request(`/api/Payments/${id}`, { method: 'DELETE' }),

  // 13. Tracking
  getTracking: () => request('/api/Tracking'),
  getTrackingById: (id) => request(`/api/Tracking/${id}`),
  createTracking: (trackingData) => request('/api/Tracking', { method: 'POST', body: trackingData }),
  updateTracking: (id, trackingData) => request(`/api/Tracking/${id}`, { method: 'PUT', body: trackingData }),

  // 14. UnitRegistrations
  getUnitRegistrations: () => request('/api/UnitRegistrations/search'),
  getUnitRegistrationById: (id) => request(`/api/UnitRegistrations/${id}`),
  getUnitRegistrationByJob: (jobId) => request(`/api/UnitRegistrations/by-job/${jobId}`),
  createUnitRegistration: (unitData) => request('/api/UnitRegistrations', { method: 'POST', body: unitData }),
  updateUnitRegistration: (id, unitData) => request(`/api/UnitRegistrations/${id}`, { method: 'PUT', body: unitData }),
  deleteUnitRegistration: (id) => request(`/api/UnitRegistrations/${id}`, { method: 'DELETE' }),

  // 15. Auth
  register: (userData) => request('/api/company/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/api/company/auth/login', { method: 'POST', body: credentials }),
  getCurrentUserProfile: () => request('/api/company/auth/profile'),
  updateCurrentUserProfile: (profileData) => request('/api/company/auth/profile', { method: 'PUT', body: profileData }),
  changePassword: (passwordData) => request('/api/company/auth/change-password', { method: 'POST', body: passwordData }),

  // Legacy/Backward Compatibility
  getForemen: () => request('/api/Technicians'),
  updateForemanStatus: (id, statusData) => request(`/api/Technicians/${id}/status`, { method: 'PUT', body: statusData.status }),
  getCompaniesSummary:  () => request('/api/Companies/summary'),
  getClientsSummary:    () => request('/api/Clients/summary'),
  getTechniciansSummary: () => request('/api/Technicians/summary'),
  updateCompanyStatus: (id, statusData) => request(`/api/Companies/${id}/status`, { method: 'PUT', body: statusData.status }),
  updateClientStatus: (id, statusData) => request(`/api/Clients/${id}`, { method: 'PUT', body: statusData }),
  updateTechnicianStatus: (id, statusData) => request(`/api/Technicians/${id}/status`, { method: 'PUT', body: statusData.status }),
  getUnitAutoData: (clientId) => request(`/api/UnitRegistrations/${clientId}`),
  searchUnitRegistrations: (query) => request(`/api/UnitRegistrations?search=${query}`),
  getUnitRegistrationRemarks: (id) => request(`/api/UnitRegistrations/${id}`),
  getWorkReportAutoData: (techId) => request(`/api/DailyWorkReports/${techId}`),
  searchDailyWorkReports: (query) => request(`/api/DailyWorkReports?search=${query}`),
  getMasterCardInvoices: (id) => request(`/api/MasterCards/${id}`),
  updateMasterCardStatus: (id, statusData) => request(`/api/MasterCards/${id}`, { method: 'PUT', body: statusData }),
  getTrackingLocation: () => request('/api/Tracking'),
  getJobTrackingStatus: (jobId) => request(`/api/Tracking/${jobId}`),
  getAllJobMessages: () => request('/api/JobMessages'),
  getDispatchBids: () => request('/api/Dispatch/bids'),
};
