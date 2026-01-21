import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import orderReducer from "./slices/orderSlice";

const loadAuthState = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const raw = window.localStorage.getItem("vendyz.auth");
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as {
      token: string;
      email: string;
      userId: string;
      role: string;
    };
  } catch {
    return undefined;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    order: orderReducer,
  },
  preloadedState: {
    auth: loadAuthState() ?? undefined,
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    const { token, email, userId, role } = store.getState().auth;
    if (token) {
      window.localStorage.setItem(
        "vendyz.auth",
        JSON.stringify({ token, email, userId, role })
      );
    } else {
      window.localStorage.removeItem("vendyz.auth");
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
