import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../utils/api';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'MAINTENANCE' | 'PENALTY';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  gateway?: string;
  transactionId?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  rental: {
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
    };
  };
}

interface PaymentState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
}

const initialState: PaymentState = {
  payments: [],
  isLoading: false,
  error: null,
  pagination: null,
};

export const initializePayment = createAsyncThunk(
  'payment/initializePayment',
  async (paymentData: {
    rentalId: string;
    amount: number;
    paymentType: string;
    description?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.initializePayment(paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to initialize payment');
    }
  }
);

export const fetchMyPayments = createAsyncThunk(
  'payment/fetchMyPayments',
  async (params: any, { rejectWithValue }: { rejectWithValue: Function }) => {
    try {
      const response = await apiService.getMyPayments();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;