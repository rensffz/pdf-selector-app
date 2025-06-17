import { createSlice } from '@reduxjs/toolkit';

const pdfSlice = createSlice({
  name: 'pdf',
  initialState: {
    pdfDocument: null,
    selections: [],
  },
  reducers: {
    setPDF: (state, action) => {
      state.pdfDocument = action.payload;
    },
    addSelection: (state, action) => {
      state.selections.push(action.payload);
    },
  },
});

export const { setPDF, addSelection } = pdfSlice.actions;
export default pdfSlice.reducer;
