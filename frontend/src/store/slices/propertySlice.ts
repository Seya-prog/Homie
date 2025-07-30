import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'CONDO' | 'STUDIO' | 'ROOM' | 'COMMERCIAL';
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnished: boolean;
  rentAmount: number;
  deposit: number;
  currency: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'INACTIVE';
  available: boolean;
  images: string[];
  virtualTour?: string;
  amenities: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    faydaVerified: boolean;
  };
  averageRating?: number;
  reviewCount?: number;
}

interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
}

const initialState: PropertyState = {
  properties: [],
  currentProperty: null,
  isLoading: false,
  error: null,
  pagination: null,
};

export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/properties', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'property/fetchPropertyById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property');
    }
  }
);

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        state.properties = action.payload.properties;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPropertyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentProperty } = propertySlice.actions;
export default propertySlice.reducer;