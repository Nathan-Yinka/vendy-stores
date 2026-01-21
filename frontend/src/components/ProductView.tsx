import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { clearOrderResult, setOrderResult } from "../app/slices/orderSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

const ProductView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token, role } = useAppSelector((state) => state.auth);
  const { lastStatus, lastMessage } = useAppSelector((state) => state.order);
  const [products, setProducts] = useState<
    { id: string; name: string; stock: number }[]
  >([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [stock, setStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [newProductName, setNewProductName] = useState("");
  const [newProductStock, setNewProductStock] = useState(5);
  const [createStatus, setCreateStatus] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orders, setOrders] = useState<
    {
      id: string;
      productId: string;
      productName?: string;
      quantity: number;
      status: string;
    }[]
  >([]);
  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const ordersLimit = 5;
  const [editStock, setEditStock] = useState<number | "">("");
  const [editStatus, setEditStatus] = useState("");
  const pendingIdempotencyKey = useRef<string | null>(null);
  const pendingIdempotencyCount = useRef(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  const loadProducts = async () => {
    setLoadingList(true);
    setListError("");
    try {
      const data = await api.listProducts(page, limit);
      const items = data.items.map((item) => ({
        id: item.product_id,
        name: item.name,
        stock: item.stock,
      }));
      setProducts(items);
      setTotal(data.total);
      const nextId = selectedProductId || items[0]?.id || "";
      setSelectedProductId(nextId);
      if (nextId) {
        await loadProduct(nextId);
      } else {
        setLoading(false);
        setProductName("");
        setStock(0);
      }
    } catch (err) {
      setListError("Unable to load products");
      setLoading(false);
    } finally {
      setLoadingList(false);
    }
  };

  const loadProduct = async (productId: string) => {
    setLoading(true);
    setError("");
    try {
      const product = await api.getProduct(productId);
      setProductName(product.name);
      setStock(product.stock);
    } catch (err) {
      setError("Unable to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [page]);

  useEffect(() => {
    if (!token) {
      setOrders([]);
      dispatch(clearOrderResult());
      setOrdersError("");
      setOrdersLoading(false);
      setOrdersPage(1);
      setOrdersTotal(0);
      setEditStatus("");
      setError("");
      setListError("");
      pendingIdempotencyKey.current = null;
      pendingIdempotencyCount.current = 0;
      return;
    }
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const data = await api.listOrders(token, ordersPage, ordersLimit);
        setOrders(
          data.items.map((order) => ({
            id: order.order_id,
            productId: order.product_id,
            productName: order.product_name,
            quantity: order.quantity,
            status: order.status,
          }))
        );
        setOrdersTotal(data.total);
      } catch (err) {
        setOrdersError("Unable to load orders");
      } finally {
        setOrdersLoading(false);
      }
    };
    void loadOrders();
  }, [token, ordersPage]);

  const handleBuy = async () => {
    if (!token) {
      dispatch(setOrderResult({ status: "FAILED", message: "Login required" }));
      return;
    }
    if (!selectedProductId) {
      dispatch(setOrderResult({ status: "FAILED", message: "No product selected" }));
      return;
    }
    try {
      if (!pendingIdempotencyKey.current) {
        pendingIdempotencyKey.current = crypto.randomUUID();
      }
      pendingIdempotencyCount.current += 1;
      const idempotencyKey = pendingIdempotencyKey.current;
      const result = await api.createOrder(
        token,
        selectedProductId,
        quantity,
        idempotencyKey
      );
      dispatch(setOrderResult({ status: result.status, message: result.message }));
      if (result.status === "CONFIRMED") {
        setStock((prev) => Math.max(prev - quantity, 0));
        setProducts((prev) =>
          prev.map((item) =>
            item.id === selectedProductId
              ? { ...item, stock: Math.max(item.stock - quantity, 0) }
              : item
          )
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      await Promise.all([loadProduct(selectedProductId), loadProducts()]);
      if (token) {
        const data = await api.listOrders(token, ordersPage, ordersLimit);
        setOrders(
          data.items.map((order) => ({
            id: order.order_id,
            productId: order.product_id,
            productName: order.product_name,
            quantity: order.quantity,
            status: order.status,
          }))
        );
        setOrdersTotal(data.total);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order request failed";
      dispatch(setOrderResult({ status: "FAILED", message }));
    } finally {
      pendingIdempotencyCount.current = Math.max(0, pendingIdempotencyCount.current - 1);
      if (pendingIdempotencyCount.current === 0) {
        pendingIdempotencyKey.current = null;
      }
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    void loadProduct(productId);
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setCreateStatus("Login required");
      return;
    }
    setCreateStatus("");
    try {
      await api.createProduct(token, newProductName, newProductStock);
      setNewProductName("");
      setNewProductStock(5);
      await loadProducts();
      setCreateStatus("Product created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create product failed";
      setCreateStatus(message);
    }
  };

  const handleUpdateStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedProductId) {
      setEditStatus("Select a product first");
      return;
    }
    if (editStock === "") {
      setEditStatus("Enter a stock value");
      return;
    }
    setEditStatus("");
    try {
      await api.updateStock(token, selectedProductId, Number(editStock));
      setEditStatus("Stock updated");
      await loadProducts();
      await loadProduct(selectedProductId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update stock failed";
      setEditStatus(message);
    }
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(clamped);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
      <h2 className="text-2xl font-semibold">Products</h2>
      <p className="mt-2 text-sm text-slate-400">
        Select a product, pick a quantity, and place your order.
      </p>
      <div className="mt-4 space-y-3">
        {loadingList ? (
          <p className="text-sm text-slate-500">Loading products...</p>
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              className={`w-full rounded-xl border px-4 py-2 text-left text-sm transition ${
                product.id === selectedProductId
                  ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-200 hover:border-slate-600"
              }`}
              onClick={() => handleSelectProduct(product.id)}
            >
              <div className="flex items-center justify-between">
                <span>{product.name}</span>
                <span className="text-xs text-slate-400">Stock {product.stock}</span>
              </div>
            </button>
          ))
        )}
        {listError && <p className="text-sm text-rose-300">{listError}</p>}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-800 px-2 py-1 hover:border-slate-600"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loadingList}
            >
              Prev
            </button>
            <button
              className="rounded-lg border border-slate-800 px-2 py-1 hover:border-slate-600"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loadingList}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <p className="mt-4 text-slate-400">Loading product...</p>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-lg font-medium">{productName}</p>
          <p className="text-slate-400">
            Stock Remaining: <span className="text-white">{stock}</span>
          </p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      <div className="mt-4">
        <label className="text-xs uppercase tracking-widest text-slate-500">
          Quantity
        </label>
        <input
          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm"
          type="number"
          min={1}
          max={Math.max(stock, 1)}
          value={quantity}
          onChange={(event) => {
            const next = Math.max(1, Number(event.target.value));
            setQuantity(stock > 0 ? Math.min(next, stock) : next);
          }}
        />
      </div>
      <button
        className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        onClick={() => void handleBuy()}
        disabled={loading || !selectedProductId}
      >
        Buy Now
      </button>
      {lastStatus && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
          <p className="font-semibold">{lastStatus}</p>
          <p className="text-slate-400">{lastMessage}</p>
        </div>
      )}
      {role === "ADMIN" && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Admin: Add Product</p>
          <form className="mt-3 space-y-3" onSubmit={(event) => void handleCreateProduct(event)}>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
              placeholder="Product name"
              value={newProductName}
              onChange={(event) => setNewProductName(event.target.value)}
            />
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
              type="number"
              min={1}
              value={newProductStock}
              onChange={(event) => setNewProductStock(Number(event.target.value))}
            />
            <button
              type="submit"
              className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/30"
              disabled={!newProductName}
            >
              Create Product
            </button>
          </form>
          {createStatus && <p className="mt-2 text-xs text-slate-400">{createStatus}</p>}
        </div>
      )}
      {role === "ADMIN" && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="text-sm font-semibold text-white">Admin: Update Stock</p>
          <form className="mt-3 space-y-3" onSubmit={(event) => void handleUpdateStock(event)}>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
              placeholder="New stock"
              type="number"
              min={0}
              value={editStock}
              onChange={(event) =>
                setEditStock(event.target.value === "" ? "" : Number(event.target.value))
              }
            />
            <button
              type="submit"
              className="w-full rounded-xl border border-blue-400/40 bg-blue-400/20 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-400/30"
            >
              Update Stock
            </button>
          </form>
          {editStatus && <p className="mt-2 text-xs text-slate-400">{editStatus}</p>}
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
        <p className="text-sm font-semibold text-white">Your Orders</p>
        {ordersLoading ? (
          <p className="mt-2 text-xs text-slate-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No confirmed orders yet.</p>
        ) : (
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2"
              >
                <span className="text-slate-200">
                  {order.productName || order.productId}
                </span>
                <span className="text-slate-400">x{order.quantity}</span>
                <span className="text-emerald-300">{order.status}</span>
              </div>
            ))}
          </div>
        )}
        {ordersError && <p className="mt-2 text-xs text-rose-300">{ordersError}</p>}
        {ordersTotal > ordersLimit && (
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Page {ordersPage} of {Math.max(1, Math.ceil(ordersTotal / ordersLimit))}
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-800 px-2 py-1 hover:border-slate-600"
                onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                disabled={ordersPage <= 1 || ordersLoading}
              >
                Prev
              </button>
              <button
                className="rounded-lg border border-slate-800 px-2 py-1 hover:border-slate-600"
                onClick={() =>
                  setOrdersPage(
                    Math.min(
                      Math.ceil(ordersTotal / ordersLimit),
                      ordersPage + 1
                    )
                  )
                }
                disabled={
                  ordersPage >= Math.ceil(ordersTotal / ordersLimit) || ordersLoading
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductView;
