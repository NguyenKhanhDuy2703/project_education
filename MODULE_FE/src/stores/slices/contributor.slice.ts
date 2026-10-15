import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LabSeries, ContentLifecycleStatus } from '@/types/lab.types';

export interface ContributorState {
  mySeries: LabSeries[];
  myLabs: any[];
  isCreateDialogOpen: boolean;
  createDialogDefaultType: 'series' | 'lab';
}

const initialState: ContributorState = {
  mySeries: [],
  myLabs: [],
  isCreateDialogOpen: false,
  createDialogDefaultType: 'series',
};

export const contributorSlice = createSlice({
  name: 'contributor',
  initialState,
  reducers: {
    setMySeries: (state, action: PayloadAction<LabSeries[]>) => {
      state.mySeries = action.payload;
    },
    addOptimisticSeries: (state, action: PayloadAction<LabSeries>) => {
      // Add to head if not existing
      const index = state.mySeries.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.mySeries[index] = action.payload;
      } else {
        state.mySeries.unshift(action.payload);
      }
    },
    replaceOptimisticSeries: (
      state,
      action: PayloadAction<{ tempId: string; series: LabSeries }>
    ) => {
      const index = state.mySeries.findIndex(
        (s) => s.id === action.payload.tempId || s.id === action.payload.series.id
      );
      if (index >= 0) {
        state.mySeries[index] = action.payload.series;
      } else {
        state.mySeries.unshift(action.payload.series);
      }
    },
    removeOptimisticSeries: (state, action: PayloadAction<string>) => {
      state.mySeries = state.mySeries.filter((s) => s.id !== action.payload);
    },
    updateSeriesStatus: (
      state,
      action: PayloadAction<{ id: string; status: ContentLifecycleStatus; feedback?: string }>
    ) => {
      const target = state.mySeries.find((s) => s.id === action.payload.id);
      if (target) {
        target.status = action.payload.status;
        if (action.payload.feedback !== undefined) {
          target.reviewFeedback = action.payload.feedback;
        }
      }
    },
    setMyLabs: (state, action: PayloadAction<any[]>) => {
      state.myLabs = action.payload;
    },
    addOptimisticLab: (state, action: PayloadAction<any>) => {
      const index = state.myLabs.findIndex((l) => l.id === action.payload.id);
      if (index >= 0) {
        state.myLabs[index] = action.payload;
      } else {
        state.myLabs.unshift(action.payload);
      }
    },
    openCreateDialog: (state, action: PayloadAction<'series' | 'lab' | undefined>) => {
      state.isCreateDialogOpen = true;
      state.createDialogDefaultType = action.payload || 'series';
    },
    closeCreateDialog: (state) => {
      state.isCreateDialogOpen = false;
    },
  },
});

export const {
  setMySeries,
  addOptimisticSeries,
  replaceOptimisticSeries,
  removeOptimisticSeries,
  updateSeriesStatus,
  setMyLabs,
  addOptimisticLab,
  openCreateDialog,
  closeCreateDialog,
} = contributorSlice.actions;

export default contributorSlice.reducer;
