import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string;
  email: string;
  userId: string;
  role: string;
}

const initialState: AuthState = {
  token: "",
  email: "",
  userId: "",
  role: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        token: string;
        email: string;
        userId: string;
        role: string;
      }>
    ) {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.userId = action.payload.userId;
      state.role = action.payload.role;
    },
    clearCredentials(state) {
      state.token = "";
      state.email = "";
      state.userId = "";
      state.role = "";
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
