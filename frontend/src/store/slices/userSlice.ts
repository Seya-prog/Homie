import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../utils/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: 'TENANT' | 'LANDLORD' | 'ADMIN';
  faydaId?: string;
  faydaVerified: boolean;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  kycData?: any;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  kycLoading: boolean;
  kycError: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  kycLoading: false,
  kycError: null,
};

// Async thunks
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateProfile(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await apiService.uploadAvatar(file);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);

export const initiateKYCVerification = createAsyncThunk(
  'user/initiateKYC',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.initiateKYC();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initiate KYC');
    }
  }
);

export const completeKYCVerification = createAsyncThunk(
  'user/completeKYC',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await apiService.completeKYC(code);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete KYC');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.kycError = null;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upload avatar
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar = action.payload.avatar;
        }
      })
      // Initiate KYC
      .addCase(initiateKYCVerification.pending, (state) => {
        state.kycLoading = true;
        state.kycError = null;
      })
      .addCase(initiateKYCVerification.fulfilled, (state, action) => {
        state.kycLoading = false;
        // Redirect to Fayda will be handled in component
      })
      .addCase(initiateKYCVerification.rejected, (state, action) => {
        state.kycLoading = false;
        state.kycError = action.payload as string;
      })
      // Complete KYC
      .addCase(completeKYCVerification.pending, (state) => {
        state.kycLoading = true;
        state.kycError = null;
      })
      .addCase(completeKYCVerification.fulfilled, (state, action) => {
        state.kycLoading = false;
        if (state.profile) {
          state.profile.faydaVerified = true;
          state.profile.kycStatus = 'VERIFIED';
          state.profile.kycData = action.payload.kycData;
        }
      })
      .addCase(completeKYCVerification.rejected, (state, action) => {
        state.kycLoading = false;
        state.kycError = action.payload as string;
      });
  },
});

export const { clearError, setProfile } = userSlice.actions;
export default userSlice.reducer;