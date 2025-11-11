import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../utils/api';

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  estimatedCost?: number;
  actualCost?: number;
  images: string[];
  propertyId: string;
  requesterId: string;
  property?: any;
  requester?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface MaintenanceState {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  selectedRequest: MaintenanceRequest | null;
}

const initialState: MaintenanceState = {
  requests: [],
  loading: false,
  error: null,
  selectedRequest: null,
};

// Async thunks
export const fetchMaintenanceRequests = createAsyncThunk(
  'maintenance/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getMaintenanceRequests();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch maintenance requests');
    }
  }
);

export const createMaintenanceRequest = createAsyncThunk(
  'maintenance/createRequest',
  async (requestData: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'requesterId'>, { rejectWithValue }) => {
    try {
      const response = await apiService.createMaintenanceRequest(requestData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create maintenance request');
    }
  }
);

export const updateMaintenanceRequest = createAsyncThunk(
  'maintenance/updateRequest',
  async ({ id, updateData }: { id: string; updateData: Partial<MaintenanceRequest> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateMaintenanceRequest(id, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update maintenance request');
    }
  }
);

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedRequest: (state, action: PayloadAction<MaintenanceRequest | null>) => {
      state.selectedRequest = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch requests
      .addCase(fetchMaintenanceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchMaintenanceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create request
      .addCase(createMaintenanceRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMaintenanceRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.unshift(action.payload);
      })
      .addCase(createMaintenanceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update request
      .addCase(updateMaintenanceRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(req => req.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
        if (state.selectedRequest?.id === action.payload.id) {
          state.selectedRequest = action.payload;
        }
      });
  },
});

export const { clearError, setSelectedRequest } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;