import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

interface NetworkState {
  hasConnection: boolean
}

const initialState: NetworkState = {
  hasConnection: true
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setHasConnection: (state: NetworkState, action: PayloadAction<boolean>) => {
      state.hasConnection = action.payload;
    }
  }
});

export const { setHasConnection } = networkSlice.actions;

export const selectHasConnection = (state: RootState) => state.network.hasConnection;

export default networkSlice.reducer;