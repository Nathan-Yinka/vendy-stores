export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async login(email: string, password: string) {
    return this.post("/auth/login", { email, password });
  }

  async getProduct(productId: string) {
    return this.get(`/products/${productId}`);
  }

  async createOrder(token: string, productId: string, quantity: number) {
    return this.post(
      "/orders",
      { productId, quantity },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  }

  private async get(path: string, headers: Record<string, string> = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers,
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Request failed");
    }

    return payload.data;
  }

  private async post(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Request failed");
    }

    return payload.data;
  }
}
