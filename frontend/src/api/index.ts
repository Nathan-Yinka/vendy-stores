import { AxiosError } from "axios";
import { http } from "./http";
import { routes } from "./routes";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const { data } = await promise;
    if (!data.success) {
      throw new Error(data.message ?? "Request failed");
    }
    return data.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Request failed";
    throw new Error(message);
  }
}

export const api = {
  login: (email: string, password: string) =>
    unwrap<{
      token: string;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    }>(http.post(routes.auth.login, { email, password })),

  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => unwrap(http.post(routes.auth.register, payload)),

  logout: (token: string) =>
    unwrap(
      http.post(
        routes.auth.logout,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ),

  listProducts: (page: number, limit: number) =>
    unwrap<{
      items: { product_id: string; name: string; stock: number }[];
      page: number;
      limit: number;
      total: number;
    }>(http.get(routes.products.list, { params: { page, limit } })),

  getProduct: (productId: string) =>
    unwrap<{ product_id: string; name: string; stock: number }>(
      http.get(routes.products.detail(productId))
    ),

  createProduct: (token: string, name: string, stock: number) =>
    unwrap<{ product_id: string; name: string; stock: number }>(
      http.post(
        routes.products.create,
        { name, stock },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ),
  updateStock: (token: string, productId: string, stock: number) =>
    unwrap<{ product_id: string; name: string; stock: number }>(
      http.post(
        routes.products.updateStock(productId),
        { stock },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ),

  createOrder: (
    token: string,
    productId: string,
    quantity: number,
    idempotencyKey?: string
  ) =>
    unwrap<{ order_id: string; status: string; message: string }>(
      http.post(
        routes.orders.create,
        { productId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
          },
        }
      )
    ),

  listOrders: (token: string, page: number, limit: number) =>
    unwrap<{
      items: {
        order_id: string;
        status: string;
        product_id: string;
        product_name?: string;
        quantity: number;
        user_id: string;
      }[];
      page: number;
      limit: number;
      total: number;
    }>(
      http.get(routes.orders.list, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      })
    ),
};
