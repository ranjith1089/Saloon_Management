import api from './api';

export const settingsApi = {
  // Branding
  getBranding: async () => (await api.get('/settings/branding')).data.data,
  updateBranding: async (data: any) => (await api.put('/settings/branding', data)).data.data,

  // Currency
  getCurrency: async () => (await api.get('/settings/currency')).data.data,
  updateCurrency: async (data: any) => (await api.put('/settings/currency', data)).data.data,

  // Business
  getBusiness: async () => (await api.get('/settings/business')).data.data,
  updateBusiness: async (data: any) => (await api.put('/settings/business', data)).data.data,

  // Holidays
  listHolidays: async (params?: any) => (await api.get('/settings/holidays', { params })).data.data,
  createHoliday: async (data: any) => (await api.post('/settings/holidays', data)).data.data,
  updateHoliday: async (id: string, data: any) => (await api.patch(`/settings/holidays/${id}`, data)).data.data,
  deleteHoliday: async (id: string) => (await api.delete(`/settings/holidays/${id}`)).data,
  bulkCreateHolidays: async (holidays: any[]) => (await api.post('/settings/holidays/bulk', { holidays })).data.data,

  // Payment methods
  listPaymentMethods: async () => (await api.get('/settings/payment-methods')).data.data,
  createPaymentMethod: async (data: any) => (await api.post('/settings/payment-methods', data)).data.data,
  updatePaymentMethod: async (id: string, data: any) => (await api.patch(`/settings/payment-methods/${id}`, data)).data.data,
  deletePaymentMethod: async (id: string) => (await api.delete(`/settings/payment-methods/${id}`)).data,
  reorderPaymentMethods: async (orderedIds: string[]) => (await api.patch('/settings/payment-methods/reorder', { orderedIds })).data.data,
};
