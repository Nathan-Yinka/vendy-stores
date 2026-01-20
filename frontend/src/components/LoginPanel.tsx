import React from "react";
import { connect } from "react-redux";
import { ApiClient } from "../api/client";
import { setCredentials } from "../app/slices/authSlice";
import { RootState } from "../app/store";

const api = new ApiClient(
  import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000"
);

interface LoginPanelProps {
  token: string;
  email: string;
  setCredentials: (payload: { token: string; email: string; userId: string }) => void;
}

interface LoginPanelState {
  email: string;
  password: string;
  status: string;
}

class LoginPanel extends React.Component<LoginPanelProps, LoginPanelState> {
  state: LoginPanelState = {
    email: "lead@vendyz.dev",
    password: "flashsale",
    status: "",
  };

  private async handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.setState({ status: "" });

    try {
      const result = await api.login(this.state.email, this.state.password);
      if (!result.token) {
        this.setState({ status: "Invalid credentials" });
        return;
      }

      this.props.setCredentials({
        token: result.token,
        email: result.email,
        userId: result.userId,
      });
      this.setState({ status: "Signed in" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.setState({ status: message });
    }
  }

  render() {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h2 className="text-2xl font-semibold">Operator Login</h2>
        <p className="mt-2 text-sm text-slate-400">
          Use the seeded account to authenticate before buying.
        </p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void this.handleLogin(event)}>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            type="email"
            value={this.state.email}
            onChange={(event) => this.setState({ email: event.target.value })}
            placeholder="Email"
          />
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            type="password"
            value={this.state.password}
            onChange={(event) => this.setState({ password: event.target.value })}
            placeholder="Password"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Login
          </button>
        </form>
        {this.props.token && (
          <p className="mt-3 text-sm text-emerald-200">Signed in as {this.props.email}</p>
        )}
        {this.state.status && !this.props.token && (
          <p className="mt-3 text-sm text-rose-300">{this.state.status}</p>
        )}
      </section>
    );
  }
}

const mapState = (state: RootState) => ({
  token: state.auth.token,
  email: state.auth.email,
});

const mapDispatch = { setCredentials };

export default connect(mapState, mapDispatch)(LoginPanel);
