// src/OrdersDashboard/index.tsx
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

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const OrdersDashboard: React.FC = () => {
  const [orderFiles, setOrderFiles] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/listOrders`)
      .then((r) => r.json())
      .then((d) => {
        console.log("📂 /api/listOrders ->", d);
        setOrderFiles(d.orders || []);
      })
      .catch((err) => console.error("Error listOrders:", err));
  }, []);

  const loadOrder = (filename: string) => {
    const orderId = filename.replace("orderData-", "").replace(".xlsx", "");
    setSelectedOrder(orderId);

    fetch(`${API_BASE}/api/getOrder/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        console.log("📦 /api/getOrder raw ->", d);
        const items = (d.data || []) as OrderItem[];

        const normalized = items.map((it) => {
          let link = it.linkImg || "";
          if (link && !link.startsWith("http")) {
            link = `${API_BASE}${link.startsWith("/") ? "" : "/"}${link}`;
          }
          console.log("🖼 item.rawLink:", it.linkImg, "-> normalized:", link);
          return { ...it, linkImg: link };
        });

        const filtered = normalized.filter((o) => String(o.status).trim() !== "Completada");
        console.log("✅ Items mostrados (filtro):", filtered);
        setOrderItems(filtered);
      })
      .catch((err) => {
        console.error("Error getOrder:", err);
        setOrderItems([]);
      });
  };

  const updateStatus = async (status: string) => {
    if (!selectedOrder) return;
    await fetch(`${API_BASE}/api/updateOrderStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder, status }),
    });
    loadOrder(`orderData-${selectedOrder}.xlsx`);
  };

  // Apertura del modal: con logs claros
  const openImage = (url: string) => {
    console.log("🔍 openImage ->", url);
    if (!url) return;
    setSelectedImg(url);
    setModalOpen(true);
  };

  const closeImage = () => {
    setModalOpen(false);
    setSelectedImg(null);
  };

  // cerrar con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debug: ver clicks globales (solo para desarrollo, quitar en prod)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      // uncomment para ver todos los clicks
      // console.log("doc click:", (e.target as HTMLElement).tagName, e);
    };
    // document.addEventListener("click", onDocClick);
    return () => {
      // document.removeEventListener("click", onDocClick);
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Dashboard de Órdenes</h1>

      <div className="mb-4">
        <h2 className="font-semibold">Órdenes disponibles:</h2>
        <ul className="list-disc ml-6">
          {orderFiles.map((f) => (
            <li key={f}>
              <button className="text-blue-600 underline" onClick={() => loadOrder(f)}>
                {f}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedOrder && (
        <div>
          <h2 className="text-lg font-bold mb-2">Detalles de la orden {selectedOrder}</h2>

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
              {orderItems.map((item, idx) => {
                const finalImg = item.linkImg && item.linkImg.startsWith("http") ? item.linkImg : "";
                return (
                  <tr key={idx} className="text-center">
                    <td className="px-4 py-2">
                      {finalImg ? (
                        <img
                          src={finalImg}
                          alt={item.productName}
                          // estilos para asegurar clickable
                          style={{ width: 64, height: 64, objectFit: "contain", cursor: "pointer", display: "block", pointerEvents: "auto" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("IMG CLICK ->", finalImg);
                            openImage(finalImg);
                          }}
                          onError={(e) => {
                            console.error("❌ Image load error:", finalImg);
                            (e.target as HTMLImageElement).src = "/imgs/placeholder.png";
                          }}
                          loading="lazy"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openImage(finalImg);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">Sin imagen</span>
                      )}
                      {/* fallback: abrir en nueva pestaña */}
                      {finalImg && (
                        <div style={{ marginTop: 6 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Abrir en nueva pestaña ->", finalImg);
                              window.open(finalImg, "_blank");
                            }}
                            className="text-xs underline"
                          >
                            Abrir
                          </button>
                        </div>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL INLINE STYLES (garantiza visibilidad aunque Tailwind no cargue) */}
      {modalOpen && selectedImg && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeImage}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 99999,
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "95%", maxHeight: "95%", position: "relative" }}>
            <button
              onClick={closeImage}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                right: -12,
                top: -12,
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "#fff",
                border: "none",
                cursor: "pointer",
                zIndex: 100000,
                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ×
            </button>

            <img
              src={selectedImg}
              alt="Vista ampliada"
              style={{ display: "block", maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 6px 30px rgba(0,0,0,0.6)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/imgs/placeholder.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersDashboard;
