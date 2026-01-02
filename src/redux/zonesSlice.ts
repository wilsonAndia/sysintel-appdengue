import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Zone {
  regionName: string;
  groupName: string;
  visitId: string;
  sectorGroup: string;
  sectorId: string;
  inTheArea?: boolean;
  startDate: string;
  endDate: string;
}

interface ZoneState {
  selectedZone: Zone | null;
}

const initialState: ZoneState = {
  selectedZone: null,
};

const zoneSlice = createSlice({
  name: 'zone',
  initialState,
  reducers: {
    setSelectedZone(state, action: PayloadAction<Zone | null>) {
      state.selectedZone = action.payload;
    },
    clearSelectedZone(state) {
      state.selectedZone = null;
    },
  },
});

export const { setSelectedZone, clearSelectedZone } = zoneSlice.actions;
export default zoneSlice.reducer;
