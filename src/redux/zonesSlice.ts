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

  groupId: string; // ID del grupo para saber como quién reporta
  startTime: string; // Hora de inicio (HH:MM:SS)
  endTime: string; // Hora de fin (HH:MM:SS)
  latitude: string; // 👈 NUEVO: Latitud central de la zona
  longitude: string; // 👈 NUEVO: Longitud central de la zona
  coordinates: { latitude: string; longitude: string }[];
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
