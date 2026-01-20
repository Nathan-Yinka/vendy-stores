import React from "react";
import { io, Socket } from "socket.io-client";

interface ServiceStatus {
  service: string;
  lastSeen: number;
  isUp: boolean;
}

interface ServiceHealthPanelState {
  statuses: ServiceStatus[];
}

class ServiceHealthPanel extends React.Component<{}, ServiceHealthPanelState> {
  private socket?: Socket;
  private interval?: number;

  state: ServiceHealthPanelState = {
    statuses: [],
  };

  componentDidMount() {
    const url = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000";
    this.socket = io(url, { path: "/health/socket" });
    this.socket.on("health.status", (statuses: ServiceStatus[]) => {
      this.setState({ statuses });
    });

    this.interval = window.setInterval(() => {
      this.setState((prev) => ({ statuses: [...prev.statuses] }));
    }, 1000);
  }

  componentWillUnmount() {
    if (this.interval) {
      window.clearInterval(this.interval);
    }
    this.socket?.disconnect();
  }

  render() {
    const now = Date.now();

    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h3 className="text-xl font-semibold">Service Health</h3>
        <p className="mt-1 text-xs text-slate-400">Realtime status via NATS + WebSocket.</p>
        <div className="mt-4 space-y-3">
          {this.state.statuses.length === 0 ? (
            <p className="text-sm text-slate-500">Waiting for heartbeats...</p>
          ) : (
            this.state.statuses.map((status) => {
              const secondsAgo = Math.max(0, Math.floor((now - status.lastSeen) / 1000));
              const barWidth = status.isUp ? "w-full" : "w-1/3";
              return (
                <div key={status.service} className="rounded-2xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-white">{status.service}</span>
                    <span className={`text-xs ${status.isUp ? "text-emerald-300" : "text-rose-300"}`}>
                      {status.isUp ? "UP" : "DOWN"}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${status.isUp ? "bg-emerald-400" : "bg-rose-400"} ${barWidth}`}
                    ></div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">Last ping: {secondsAgo}s ago</p>
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  }
}

export default ServiceHealthPanel;
