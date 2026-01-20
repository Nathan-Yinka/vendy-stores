import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string;
  email: string;
  userId: string;
}

const initialState: AuthState = {
  token: "",
  email: "",
  userId: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; email: string; userId: string }>
    ) {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.userId = action.payload.userId;
    },
    clearCredentials(state) {
      state.token = "";
      state.email = "";
      state.userId = "";
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
