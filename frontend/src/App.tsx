import React from "react";
import LoginPanel from "./components/LoginPanel";
import ProductView from "./components/ProductView";
import ServiceHealthPanel from "./components/ServiceHealthPanel";

class App extends React.Component {
  render() {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Vendyz Flash Sale Command Center
            </h1>
            <p className="max-w-lg text-sm text-slate-300">
              Every request routes through the API gateway with gRPC fan-out and
              NATS eventing. Only the first buyer wins the last unit.
            </p>
            <LoginPanel />
            <ServiceHealthPanel />
          </div>
          <ProductView />
        </div>
      </main>
    );
  }
}

export default App;
