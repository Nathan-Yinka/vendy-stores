import React, { useEffect, useState } from "react";
import { api } from "../api";
import { clearCredentials, setCredentials } from "../app/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../app/hooks";

const LoginPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token, email, role } = useAppSelector((state) => state.auth);
  const [formEmail, setFormEmail] = useState("lead@vendyz.dev");
  const [password, setPassword] = useState("flashsale");
  const [status, setStatus] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regStatus, setRegStatus] = useState("");

  useEffect(() => {
    setStatus("");
    setRegStatus("");
    if (token) {
      setShowRegister(false);
    }
  }, [token]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");

    try {
      const result = await api.login(formEmail, password);
      dispatch(
        setCredentials({
          token: result.token,
          email: result.email,
          userId: result.userId,
          role: result.role ?? "USER",
        })
      );
      setStatus("Signed in");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setStatus(message);
    }
  };

  const handleLogout = async () => {
    if (!token) {
      return;
    }

    try {
      await api.logout(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed";
      setStatus(message);
    } finally {
      dispatch(clearCredentials());
      setStatus("");
      setRegStatus("");
      setShowRegister(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegStatus("");
    try {
      await api.register({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
      });
      setRegStatus("Registration successful. Please log in.");
      setShowRegister(false);
      setFormEmail(regEmail);
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      setRegStatus(message);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
      <h2 className="text-2xl font-semibold">Operator Login</h2>
      <p className="mt-2 text-sm text-slate-400">
        Use the seeded account to authenticate before buying.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void handleLogin(event)}>
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
          type="email"
          value={formEmail}
          onChange={(event) => setFormEmail(event.target.value)}
          placeholder="Email"
        />
        <input
          className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          Login
        </button>
      </form>
      {token && (
        <div className="mt-3 space-y-2 text-sm text-emerald-200">
          <p>Signed in as {email}</p>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">
            Role: {role || "USER"}
          </p>
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
            onClick={() => void handleLogout()}
          >
            Logout
          </button>
        </div>
      )}
      {status && !token && <p className="mt-3 text-sm text-rose-300">{status}</p>}
      <button
        type="button"
        className="mt-4 text-xs text-slate-400 underline underline-offset-4"
        onClick={() => setShowRegister((prev) => !prev)}
      >
        {showRegister ? "Back to login" : "Create a new account"}
      </button>
      {showRegister && (
        <form className="mt-4 space-y-3" onSubmit={(event) => void handleRegister(event)}>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            placeholder="First name"
            value={regFirstName}
            onChange={(event) => setRegFirstName(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            placeholder="Last name"
            value={regLastName}
            onChange={(event) => setRegLastName(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            type="email"
            placeholder="Email"
            value={regEmail}
            onChange={(event) => setRegEmail(event.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm"
            type="password"
            placeholder="Password"
            value={regPassword}
            onChange={(event) => setRegPassword(event.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/30"
          >
            Register
          </button>
          {regStatus && <p className="text-xs text-slate-400">{regStatus}</p>}
        </form>
      )}
    </section>
  );
};

export default LoginPanel;
