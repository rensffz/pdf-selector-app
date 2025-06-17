import { configureStore } from '@reduxjs/toolkit';
import pdfReducer from '../store/pdfSlice.js';

export const store = configureStore({
  reducer: {
    pdf: pdfReducer,
  },
});
