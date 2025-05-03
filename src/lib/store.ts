// lib/store.ts
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    drugImporter: drugImporterReducer,
    // other reducers
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

function drugImporterReducer(state: unknown,): unknown {
  throw new Error('Function not implemented.');
}
