import React, { useState } from "react";
import OrderManagementSystem from './components/order-management-system';
import OrdersDashboard from "./OrdersDashboard";

const App: React.FC = () => {
  const [view, setView] = useState<"create" | "dashboard">("create");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra superior con botones */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sistema de Órdenes</h1>
        <div className="space-x-2">
          <button
            onClick={() => setView("create")}
            className={`px-4 py-2 rounded ${
              view === "create"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Crear Orden
          </button>
          <button
            onClick={() => setView("dashboard")}
            className={`px-4 py-2 rounded ${
              view === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Consultar Órdenes
          </button>
        </div>
      </header>

      {/* Renderizado condicional */}
      <main className="p-6">
        {view === "create" ? <OrderManagementSystem /> : <OrdersDashboard />}
      </main>
    </div>
  );
};

export default App;

