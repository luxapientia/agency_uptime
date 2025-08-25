import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from '../../lib/axios';
import type { MembershipState, MembershipPlan, UserMembership, MembershipPlansResponse } from '../../types/membership.types';

const initialState: MembershipState = {
  plans: [],
  bundlePrice: 0,
  totalPrice: 0,
  savings: 0,
  userMemberships: [],
  isLoading: false,
  error: null,
  selectedPlan: null,
};

// Async thunks
export const fetchMembershipPlans = createAsyncThunk(
  'membership/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/membership/membership-plans');
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch membership plans');
    }
  }
);

export const fetchUserMemberships = createAsyncThunk(
  'membership/fetchUserMemberships',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/membership/user-memberships');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user memberships');
    }
  }
);

export const createUserMembership = createAsyncThunk(
  'membership/createMembership',
  async (data: { membershipPlanId: string; endDate: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/membership/user-memberships', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create membership');
    }
  }
);

export const updateUserMembership = createAsyncThunk(
  'membership/updateMembership',
  async ({ id, data }: { id: string; data: { endDate?: string } }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/membership/user-memberships/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update membership');
    }
  }
);

export const deleteUserMembership = createAsyncThunk(
  'membership/deleteMembership',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/membership/user-memberships/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete membership');
    }
  }
);

const membershipSlice = createSlice({
  name: 'membership',
  initialState,
  reducers: {
    setSelectedPlan: (state, action: PayloadAction<MembershipPlan | null>) => {
      state.selectedPlan = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch membership plans
    builder
      .addCase(fetchMembershipPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMembershipPlans.fulfilled, (state, action: PayloadAction<MembershipPlansResponse>) => {
        state.isLoading = false;
        state.plans = action.payload.plans;
        state.bundlePrice = action.payload.bundlePrice;
        state.totalPrice = action.payload.totalPrice;
        state.savings = action.payload.savings;
      })
      .addCase(fetchMembershipPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user memberships
    builder
      .addCase(fetchUserMemberships.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserMemberships.fulfilled, (state, action: PayloadAction<UserMembership[]>) => {
        state.isLoading = false;
        state.userMemberships = action.payload;
      })
      .addCase(fetchUserMemberships.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create user membership
    builder
      .addCase(createUserMembership.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserMembership.fulfilled, (state, action: PayloadAction<UserMembership>) => {
        state.isLoading = false;
        state.userMemberships.push(action.payload);
      })
      .addCase(createUserMembership.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user membership
    builder
      .addCase(updateUserMembership.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserMembership.fulfilled, (state, action: PayloadAction<UserMembership>) => {
        state.isLoading = false;
        const index = state.userMemberships.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.userMemberships[index] = action.payload;
        }
      })
      .addCase(updateUserMembership.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete user membership
    builder
      .addCase(deleteUserMembership.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserMembership.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.userMemberships = state.userMemberships.filter(m => m.id !== action.payload);
      })
      .addCase(deleteUserMembership.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedPlan, clearError } = membershipSlice.actions;
export default membershipSlice.reducer; 