import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface InTheArea {
  inTheArea: boolean;
}

const initialState: InTheArea = {
  inTheArea: false,
};

const inTheAreaSlice = createSlice({
  name: 'inTheArea',
  initialState,
  reducers: {
    setInTheArea(state, action: PayloadAction<InTheArea>) {
      state.inTheArea = action.payload.inTheArea;
    },
    clearInTheArea(state) {
      state.inTheArea = false;
    },
  },
});

export const {clearInTheArea, setInTheArea} = inTheAreaSlice.actions;
export default inTheAreaSlice.reducer;
