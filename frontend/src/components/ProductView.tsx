import React from "react";
import { connect } from "react-redux";
import { ApiClient } from "../api/client";
import { queryClient } from "../queryClient";
import { RootState } from "../app/store";
import { setOrderResult } from "../app/slices/orderSlice";

const api = new ApiClient(
  import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000"
);

interface ProductViewProps {
  token: string;
  orderStatus: string;
  orderMessage: string;
  setOrderResult: (payload: { status: string; message: string }) => void;
}

interface ProductViewState {
  name: string;
  stock: number;
  loading: boolean;
  error: string;
}

class ProductView extends React.Component<ProductViewProps, ProductViewState> {
  state: ProductViewState = {
    name: "",
    stock: 0,
    loading: true,
    error: "",
  };

  async componentDidMount() {
    await this.loadProduct();
  }

  private async loadProduct() {
    this.setState({ loading: true, error: "" });
    try {
      const product = await queryClient.fetchQuery({
        queryKey: ["product", "product-1"],
        queryFn: () => api.getProduct("product-1"),
      });
      this.setState({
        name: product.name,
        stock: product.stock,
        loading: false,
      });
    } catch (error) {
      this.setState({
        error: "Unable to load product",
        loading: false,
      });
    }
  }

  private async handleBuy() {
    if (!this.props.token) {
      this.props.setOrderResult({
        status: "FAILED",
        message: "Login required",
      });
      return;
    }

    try {
      const result = await api.createOrder(this.props.token, "product-1", 1);
      this.props.setOrderResult({
        status: result.status,
        message: result.message,
      });
      await this.loadProduct();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Order request failed";
      this.props.setOrderResult({
        status: "FAILED",
        message,
      });
    }
  }

  render() {
    const { loading, name, stock, error } = this.state;

    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h2 className="text-2xl font-semibold">Flash Sale</h2>
        {loading ? (
          <p className="mt-4 text-slate-400">Loading product...</p>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-lg font-medium">{name}</p>
            <p className="text-slate-400">
              Stock Remaining: <span className="text-white">{stock}</span>
            </p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          onClick={() => void this.handleBuy()}
          disabled={loading}
        >
          Buy Now
        </button>
        {this.props.orderStatus && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
            <p className="font-semibold">{this.props.orderStatus}</p>
            <p className="text-slate-400">{this.props.orderMessage}</p>
          </div>
        )}
      </section>
    );
  }
}

const mapState = (state: RootState) => ({
  token: state.auth.token,
  orderStatus: state.order.lastStatus,
  orderMessage: state.order.lastMessage,
});

const mapDispatch = { setOrderResult };

export default connect(mapState, mapDispatch)(ProductView);
