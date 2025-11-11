import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = Cookies.get('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          Cookies.remove('token');
          Cookies.remove('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.api.post('/auth/login', credentials);
  }

  async register(userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
    phone?: string; 
    role: 'TENANT' | 'LANDLORD' 
  }) {
    return this.api.post('/auth/register', userData);
  }

  async getCurrentUser() {
    return this.api.get('/auth/me');
  }

  // KYC methods
  async initiateKYC() {
    return this.api.get('/auth/fayda/authorize');
  }

  async completeKYC(code: string) {
    return this.api.post('/auth/fayda/callback', { 
      code,
      state: 'frontend-callback' // We'll need to handle state properly
    });
  }

  async getKYCStatus() {
    return this.api.get('/auth/kyc/status');
  }

  // Property endpoints
  async getProperties(params?: any) {
    return this.api.get('/properties', { params });
  }

  async getMyProperties() {
    return this.api.get('/properties/my/properties');
  }

  async getProperty(id: string) {
    return this.api.get(`/properties/${id}`);
  }

  async createProperty(propertyData: any) {
    return this.api.post('/properties', propertyData);
  }

  async updateProperty(id: string, propertyData: any) {
    return this.api.put(`/properties/${id}`, propertyData);
  }

  async deleteProperty(id: string) {
    return this.api.delete(`/properties/${id}`);
  }

  // Rental endpoints
  async applyForRental(applicationData: { propertyId: string; startDate: string; endDate: string }) {
    return this.api.post('/rentals/apply', applicationData);
  }

  async createRental(rentalData: any) {
    return this.api.post('/rentals', rentalData);
  }

  async getMyRentals() {
    return this.api.get('/rentals/my-rentals');
  }

  async getApplications(status?: string) {
    return this.api.get('/rentals/applications', { params: status ? { status } : {} });
  }

  async updateApplicationStatus(id: string, status: string) {
    return this.api.put(`/rentals/${id}/status`, { status });
  }

  // Payment endpoints
  async initializePayment(paymentData: any) {
    return this.api.post('/payments/initialize', paymentData);
  }

  async verifyPayment(txRef: string) {
    return this.api.post(`/payments/verify/${txRef}`);
  }

  async getMyPayments() {
    return this.api.get('/payments/my-payments');
  }

  async getPaymentAnalytics() {
    return this.api.get('/payments/analytics');
  }

  // Maintenance endpoints
  async createMaintenanceRequest(requestData: any) {
    return this.api.post('/maintenance', requestData);
  }

  async getMaintenanceRequests() {
    return this.api.get('/maintenance');
  }

  async updateMaintenanceRequest(id: string, updateData: any) {
    return this.api.put(`/maintenance/${id}`, updateData);
  }

  // User endpoints
  async updateProfile(userData: any) {
    return this.api.put('/users/profile', userData);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiService = new ApiService();
export default apiService;