import React, { useEffect, useState } from "react";

interface Order {
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
}

const OrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/getOrders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error("❌ Error cargando órdenes:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Cargando órdenes...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">📦 Órdenes Registradas</h2>

      <div className="overflow-x-auto border rounded-lg shadow-md">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Cliente</th>
              <th className="p-2 border">Contacto</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Entrega</th>
              <th className="p-2 border">Producto</th>
              <th className="p-2 border">Imagen</th>
              <th className="p-2 border">Color</th>
              <th className="p-2 border">Talla</th>
              <th className="p-2 border">Cantidad</th>
              <th className="p-2 border">Precio Base</th>
              <th className="p-2 border">Subtotal</th>
              <th className="p-2 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center p-4">
                  No hay órdenes registradas.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-100">
                  <td className="p-2 border">{order.id}</td>
                  <td className="p-2 border">{order.companyName}</td>
                  <td className="p-2 border">{order.contact}</td>
                  <td className="p-2 border">{order.phone}</td>
                  <td className="p-2 border">{order.email}</td>
                  <td className="p-2 border">{order.deliveryDate}</td>
                  <td className="p-2 border">{order.productName}</td>
                  <td className="p-2 border text-center">
                    {order.linkImg ? (
                      <img
                        src={`http://localhost:5000${order.linkImg}`}
                        alt={order.productName}
                        className="w-16 h-16 object-contain mx-auto"
                      />
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="p-2 border">{order.color}</td>
                  <td className="p-2 border">{order.size}</td>
                  <td className="p-2 border">{order.quantity}</td>
                  <td className="p-2 border">${order.basePrice}</td>
                  <td className="p-2 border">${order.subtotal}</td>
                  <td className="p-2 border">{order.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
