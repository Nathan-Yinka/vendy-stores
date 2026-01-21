import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

interface ServiceStatus {
  service: string;
  lastSeen: number;
  isUp: boolean;
}

const ServiceHealthPanel: React.FC = () => {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const now = useMemo(() => Date.now(), [statuses]);

  useEffect(() => {
    const url = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:3000";
    const socket = io(url, { path: "/health/socket" });
    socket.on("health.status", (payload: ServiceStatus[]) => {
      setStatuses(payload);
    });

    const interval = window.setInterval(() => {
      setStatuses((prev) => [...prev]);
    }, 1000);

    return () => {
      window.clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <h3 className="text-xl font-semibold">Service Health</h3>
      <p className="mt-1 text-xs text-slate-400">Realtime status via NATS + WebSocket.</p>
      <div className="mt-4 space-y-3">
        {statuses.length === 0 ? (
          <p className="text-sm text-slate-500">Waiting for heartbeats...</p>
        ) : (
          statuses.map((status) => {
            const diffSeconds =
              status.lastSeen > 0
                ? Math.max(0, Math.floor((now - status.lastSeen) / 1000))
                : null;
            const secondsAgo =
              diffSeconds === null
                ? "never"
                : diffSeconds < 60
                ? `${diffSeconds}s`
                : diffSeconds < 3600
                ? `${Math.floor(diffSeconds / 60)}m`
                : `${Math.floor(diffSeconds / 3600)}h`;
            const barWidth = status.isUp ? "w-full" : "w-1/3";
            return (
              <div key={status.service} className="rounded-2xl border border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize text-white">
                    {status.service}
                  </span>
                  <span className={`text-xs ${status.isUp ? "text-emerald-300" : "text-rose-300"}`}>
                    {status.isUp ? "UP" : "DOWN"}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
                  <div
                    className={`h-2 rounded-full ${status.isUp ? "bg-emerald-400" : "bg-rose-400"} ${barWidth}`}
                  ></div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Last ping: {secondsAgo === "never" ? "never" : `${secondsAgo} ago`}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default ServiceHealthPanel;
