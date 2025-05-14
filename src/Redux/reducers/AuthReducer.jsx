import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchUserInfoFromAPI } from "../redux-services/authServices";

const initialState = {
  access_token: null,
  refresh_token: null,
  user_token: null,
  user_info: null,
  isLoading: false,
  isAuthenticated: false,
};

//EXPLANATION: I moved the api to authServices to prevent circular dependency
export const fetchUserInfo = createAsyncThunk(
  "authentication/fetchUserInfo",
  async () => {
    return await fetchUserInfoFromAPI();
  }
);

const AuthSlice = createSlice({
  name: "authentication",
  initialState,
  reducers: {
    SignIn: (state, action) => {
      return {
        ...state,
        user_token: action?.payload?.user_token,
        access_token: action?.payload?.access_token,
        refresh_token: action?.payload?.refresh_token,
        user_info: action?.payload?.user_info,
        isAuthenticated: true,
      };
    },
    SignOut: (state, action) => {
      return {
        ...state,
        ...initialState,
      };
    },

    UpdateAuthInfo: (state, action) => {
      return {
        ...state,
        user_info: action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.user_info = action.payload?.data?.data?.user_info || null;
        state.user_token = action.payload?.data?.data?.user_token;
        state.isLoading = false;
      })
      .addCase(fetchUserInfo.rejected, (state, action) => {
        state.user_info = null;
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { SignIn, SignOut, UpdateAuthInfo } = AuthSlice.actions;
export default AuthSlice.reducer;
