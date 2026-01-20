import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OrderState {
  lastStatus: string;
  lastMessage: string;
}

const initialState: OrderState = {
  lastStatus: "",
  lastMessage: "",
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setOrderResult(
      state,
      action: PayloadAction<{ status: string; message: string }>
    ) {
      state.lastStatus = action.payload.status;
      state.lastMessage = action.payload.message;
    },
    clearOrderResult(state) {
      state.lastStatus = "";
      state.lastMessage = "";
    },
  },
});

export const { setOrderResult, clearOrderResult } = orderSlice.actions;
export default orderSlice.reducer;
