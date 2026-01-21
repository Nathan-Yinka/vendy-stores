import axios from "axios";
import { store } from "../app/store";
import { clearCredentials } from "../app/slices/authSlice";
import { clearOrderResult } from "../app/slices/orderSlice";

const gatewayBase = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000";
const apiBase = `${gatewayBase.replace(/\/$/, "")}/api/v1`;

export const http = axios.create({
  baseURL: apiBase,
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
