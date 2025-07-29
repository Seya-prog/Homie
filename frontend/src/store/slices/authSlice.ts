import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  faydaVerified: boolean;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('token') || null,
  isLoading: false,
  isAuthenticated: !!Cookies.get('token'),
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      // Store token in cookie
      Cookies.set('token', token, { expires: 7 }); // 7 days
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'TENANT' | 'LANDLORD';
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      // Store token in cookie
      Cookies.set('token', token, { expires: 7 });
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

export const initiateFaydaVerification = createAsyncThunk(
  'auth/initiateFaydaVerification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/fayda/authorize');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate Fayda verification');
    }
  }
);

export const completeFaydaVerification = createAsyncThunk(
  'auth/completeFaydaVerification',
  async (params: { code: string; state: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/fayda/callback', params);
      const { user, token } = response.data;
      
      // Update token in cookie
      Cookies.set('token', token, { expires: 7 });
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Fayda verification failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Remove token from cookie
      Cookies.remove('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        Cookies.remove('token');
      })
      
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      
      // Fayda verification
      .addCase(completeFaydaVerification.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;