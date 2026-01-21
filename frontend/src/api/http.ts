import axios from "axios";
import { store } from "../app/store";
import { clearCredentials } from "../app/slices/authSlice";
import { clearOrderResult } from "../app/slices/orderSlice";

export const http = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000",
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      store.dispatch(clearCredentials());
      store.dispatch(clearOrderResult());
    }
    return Promise.reject(error);
  }
);
