import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../utils/api';

export interface Rental {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  deposit: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';
  propertyId: string;
  tenantId: string;
  property?: any;
  tenant?: any;
  payments?: any[];
  createdAt: string;
  updatedAt: string;
}

interface RentalState {
  rentals: Rental[];
  applications: Rental[];
  loading: boolean;
  error: string | null;
  selectedRental: Rental | null;
}

const initialState: RentalState = {
  rentals: [],
  applications: [],
  loading: false,
  error: null,
  selectedRental: null,
};

// Async thunks
export const fetchMyRentals = createAsyncThunk(
  'rental/fetchMyRentals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getMyRentals();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rentals');
    }
  }
);

export const applyForRental = createAsyncThunk(
  'rental/applyForRental',
  async (applicationData: { propertyId: string; startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.applyForRental(applicationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit application');
    }
  }
);

export const createRental = createAsyncThunk(
  'rental/createRental',
  async (rentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await apiService.createRental(rentalData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create rental');
    }
  }
);

export const fetchApplications = createAsyncThunk(
  'rental/fetchApplications',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const response = await apiService.getApplications(status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'rental/updateApplicationStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateApplicationStatus(id, status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

const rentalSlice = createSlice({
  name: 'rental',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedRental: (state, action: PayloadAction<Rental | null>) => {
      state.selectedRental = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rentals
      .addCase(fetchMyRentals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRentals.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals = action.payload;
      })
      .addCase(fetchMyRentals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Apply for rental
      .addCase(applyForRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForRental.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals.unshift(action.payload.rental);
      })
      .addCase(applyForRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create rental
      .addCase(createRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRental.fulfilled, (state, action) => {
        state.loading = false;
        state.rentals.unshift(action.payload);
      })
      .addCase(createRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch applications (landlord)
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload.applications;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update application status
      .addCase(updateApplicationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the application in the list
        const index = state.applications.findIndex(app => app.id === action.payload.rental.id);
        if (index !== -1) {
          state.applications[index] = action.payload.rental;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedRental } = rentalSlice.actions;
export default rentalSlice.reducer;