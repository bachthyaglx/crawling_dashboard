import { configureStore } from '@reduxjs/toolkit';
import urlsReducer from './urlSlice';

const LOCAL_STORAGE_KEY = 'urls';

const loadState = () => {
  try {
    const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
    return serialized ? { urls: JSON.parse(serialized) } : undefined;
  } catch {
    return undefined;
  }
};

const saveState = (state: any) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.urls));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

const store = configureStore({
  reducer: {
    urls: urlsReducer
  },
  preloadedState: loadState()
});

store.subscribe(() => saveState(store.getState()));

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
