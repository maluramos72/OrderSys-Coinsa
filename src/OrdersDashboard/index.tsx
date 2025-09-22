import React, { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  companyName: string;
  contact: string;
  phone: string;
  email: string;
  deliveryDate: string;
  productName: string;
  linkImg: string;
  color: string;
  size: string;
  quantity: number;
  basePrice: number;
  subtotal: number;
  status: string;
};

const OrdersDashboard: React.FC = () => {
  const [orderFiles, setOrderFiles] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/listOrders")
      .then((res) => res.json())
      .then((data) => setOrderFiles(data.orders));
  }, []);

  const loadOrder = (filename: string) => {
    const orderId = filename.replace("orderData-", "").replace(".xlsx", "");
    setSelectedOrder(orderId);

    fetch(`http://localhost:5000/api/getOrder/${orderId}`)
      .then((res) => res.json())
      .then((data) => setOrderItems(data.data));
  };

  const updateStatus = async (status: string) => {
    if (!selectedOrder) return;
    await fetch("http://localhost:5000/api/updateOrderStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder, status }),
    });
    alert(`Orden ${selectedOrder} actualizada a ${status}`);
    loadOrder(`orderData-${selectedOrder}.xlsx`); // refrescar
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard de Órdenes</h1>

      {/* Lista de archivos */}
      <div className="mb-4">
        <h2 className="font-semibold">Órdenes disponibles:</h2>
        <ul className="list-disc ml-6">
          {orderFiles.map((f) => (
            <li key={f}>
              <button
                className="text-blue-600 underline"
                onClick={() => loadOrder(f)}
              >
                {f}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tabla de productos */}
      {selectedOrder && (
        <div>
          <h2 className="text-lg font-bold mb-2">
            Detalles de la orden {selectedOrder}
          </h2>

          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Imagen</th>
                <th className="p-2 border">Producto</th>
                <th className="p-2 border">Talla</th>
                <th className="p-2 border">Cantidad</th>
                <th className="p-2 border">Subtotal</th>
                <th className="p-2 border">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border p-2">
                    <img
                      src={item.linkImg}
                      alt="preview"
                      style={{ width: 60, height: 60 }}
                    />
                  </td>
                  <td className="border p-2">{item.productName}</td>
                  <td className="border p-2">{item.size}</td>
                  <td className="border p-2">{item.quantity}</td>
                  <td className="border p-2">${item.subtotal}</td>
                  <td className="border p-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option>Pendiente</option>
                      <option>En Proceso</option>
                      <option>Completada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;