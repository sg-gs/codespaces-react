import { PhotoId, PhotoWithDownloadLink } from '@internxt/sdk/dist/photos';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { photosExtraReducers } from './thunks';

export interface PhotosState {
  isLoading: boolean;
  page: number;
  thereIsMore: boolean;
  items: PhotoWithDownloadLink[];
  selectedItems: PhotoId[];
  bucketId?: string;
}

const initialState: PhotosState = {
  isLoading: false,
  page: 0,
  thereIsMore: true,
  items: [],
  selectedItems: [],
};

export const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setIsLoading: (state: PhotosState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    push: (state: PhotosState, action: PayloadAction<PhotoWithDownloadLink[]>) => {
      state.items.push(...action.payload);
    },
    toggleSelect: (state: PhotosState, action: PayloadAction<PhotoId>) => {
      const id = action.payload;
      const isAlreadySelected = state.selectedItems.some((el) => el === id);

      if (isAlreadySelected) {
        state.selectedItems = state.selectedItems.filter((el) => el !== id);
      } else {
        state.selectedItems.push(id);
      }
    },
    setThereIsMore: (state: PhotosState, action: PayloadAction<boolean>) => {
      state.thereIsMore = action.payload;
    },
    incrementPage: (state: PhotosState) => {
      state.page++;
    },
    setBucketId: (state: PhotosState, action: PayloadAction<string>) => {
      state.bucketId = action.payload;
    },
  },
  extraReducers: photosExtraReducers,
});

export default photosSlice.reducer;
