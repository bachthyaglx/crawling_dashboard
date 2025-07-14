import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UrlEntry {
  url: string;
  status: 'queued' | 'running' | 'done' | 'error' | 'stopped';
}

const initialState: UrlEntry[] = [];

const urlSlice = createSlice({
  name: 'urls',
  initialState,
  reducers: {
    addUrl(state, action: PayloadAction<UrlEntry>) {
      const existing = state.find((u) => u.url === action.payload.url);
      if (existing) {
        existing.status = action.payload.status;
      } else {
        state.push(action.payload);
        if (state.length > 10) state.shift();
      }
    },
    removeUrl(state, action: PayloadAction<string>) {
      return state.filter((u) => u.url !== action.payload);
    },
    setUrls(state, action: PayloadAction<UrlEntry[]>) {
      const updates = action.payload;
      updates.forEach(update => {
        const existing = state.find(u => u.url === update.url);
        if (existing) {
          existing.status = update.status;
        } else {
          state.push(update);
        }
      });
    }
  }
});

export const { addUrl, removeUrl, setUrls } = urlSlice.actions;
export default urlSlice.reducer;
