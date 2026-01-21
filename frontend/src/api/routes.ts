export const routes = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
  },
  products: {
    list: "/products",
    detail: (id: string) => `/products/${id}`,
    create: "/products",
    updateStock: (id: string) => `/products/${id}/stock`,
  },
  orders: {
    create: "/orders",
    list: "/orders",
  },
};
