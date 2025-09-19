import React, { useEffect, useState, ChangeEvent } from "react";
import Papa from "papaparse";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

import {
  ShoppingCart,
  Upload,
  Save,
  Trash2,
  Eye,
  Plus,
  FileText,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

/* ===========================
  Interfaces / Types
   =========================== */

interface Product {
  id: number;
  name: string;
  basePrice: number;
  image: string; // path in public (e.g. /imgs/shirt.png)
  type?: string;
}

interface OrderItem {
  id: number;
  product: Product;
  color: "#FFFFFF"; // literal blanco
  size: string;
  quantity: number;
  logo: string | null; // base64 data URL
  logoPosition: { x: number; y: number }; // px relative to preview box
  subtotal: number;
}

interface CustomerInfo {
  companyName: string;
  contact: string;
  phone: string;
  email: string;
  deliveryDate: string;
}

interface Order {
  id: number;
  customer: CustomerInfo;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

/* ===========================
  ProductPreview
   =========================== */

type ProductPreviewProps = {
  product: Product | null;
  color: "#FFFFFF";
  logo: string | null;
  logoPos: { x: number; y: number };
  imageUrl?: string;
  onClickPosition?: (e: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
  width?: number;
  height?: number;
};

const ProductPreview: React.FC<ProductPreviewProps> = ({
  product,
  color,
  logo,
  logoPos,
  imageUrl,
  onClickPosition,
  id,
  width = 400,
  height = 400,
}) => {
  if (!product) {
    return (
      <div
        className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center"
        style={{ width, height }}
      >
        <p className="text-gray-400">Selecciona un producto</p>
      </div>
    );
  }

  return (
    <div
      id={id}
      onClick={onClickPosition}
      style={{
        width,
        height,
        backgroundColor: color,
        borderRadius: 8,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src={imageUrl || product.image}
        alt={product.name}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {logo && (
        <img
          src={logo}
          alt="logo"
          style={{
            position: "absolute",
            left: logoPos.x,
            top: logoPos.y,
            width: Math.min(80, width * 0.4),
            height: Math.min(80, height * 0.4),
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

/* ===========================
  Main component
   =========================== */

const OrderManagementSystem: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [quantity, setQuantity] = useState<number>(1);

  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState({ x: 200, y: 200 });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    companyName: "",
    contact: "",
    phone: "",
    email: "",
    deliveryDate: "",
  });

  const [ordersStats] = useState({ pending: 12, inProcess: 8, completed: 45 });

  /* ---------------------------
    Load products from CSV
   --------------------------- */
  useEffect(() => {
    fetch("/products.csv")
      .then((r) => r.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const parsed = result.data as any[];
            const prods: Product[] = parsed.map((row, i) => ({
              id: i + 1,
              name: row.name || row.product || `Producto ${i + 1}`,
              basePrice: parseFloat(row.basePrice || row.price || 0),
              image: row.image || "/imgs/placeholder.png",
              type: row.type || "",
            }));
            setProducts(prods);
            if (prods.length > 0) setSelectedProduct(prods[0]);
          },
        });
      })
      .catch((err) => {
        console.warn("No se pudo cargar products.csv:", err);
      });
  }, []);

  /* ---------------------------
    Handlers
   --------------------------- */
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoFile(reader.result as string);
      setLogoPosition({ x: 200, y: 200 });
    };
    reader.readAsDataURL(f);
  };

  const handlePreviewClickPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - el.left;
    const y = e.clientY - el.top;
    setLogoPosition({ x, y });
  };

  const handleAddToOrder = () => {
    if (!selectedProduct) return;
    const newItem: OrderItem = {
      id: Date.now(),
      product: selectedProduct,
      color: "#FFFFFF",
      size: selectedSize,
      quantity: quantity > 0 ? quantity : 1,
      logo: logoFile,
      logoPosition,
      subtotal: (quantity > 0 ? quantity : 1) * selectedProduct.basePrice,
    };
    setOrderItems((prev) => [...prev, newItem]);
    setLogoFile(null);
    setLogoPosition({ x: 200, y: 200 });
    setQuantity(1);
  };

  const updateOrderItem = (id: number, field: keyof OrderItem, value: any) => {
    setOrderItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value } as OrderItem;
        if (field === "quantity") {
          const q = Number(value) || 0;
          updated.subtotal = updated.product.basePrice * q;
          updated.quantity = q;
        }
        return updated;
      })
    );
  };

  const removeOrderItem = (id: number) => {
    setOrderItems((prev) => prev.filter((it) => it.id !== id));
  };

  const getTotalOrder = () => orderItems.reduce((s, it) => s + it.subtotal, 0);

  /* ---------------------------
    Export helpers
   --------------------------- */
  const exportOrder = async () => {
    if (orderItems.length === 0) {
      alert("No puedes guardar una orden sin productos.");
      return;
    }

    const orderId = Date.now();
    const now = new Date();
    const orderMeta: Order = {
      id: orderId,
      customer: { ...customerInfo },
      items: orderItems,
      total: getTotalOrder(),
      status: "Pendiente",
      createdAt: now.toISOString(),
    };

    // 🚀 Enviar todo al backend
    const itemsWithPreview = await Promise.all(
      orderItems.map(async (it) => {
        const el = document.getElementById(`hidden-preview-${it.id}`);
        let previewImage: string | null = null;

        if (el) {
          const canvas = await html2canvas(el as HTMLElement, { scale: 2 });
          previewImage = canvas.toDataURL("image/png");
        }

        return {
          ...it,
          productName: it.product.name,
          basePrice: it.product.basePrice,
          previewImage,
        };
      })
    );

// validando saveorder
    const resp = await fetch("http://localhost:5000/api/saveOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: orderMeta,
        items: itemsWithPreview,
      }),
    });

    const data = await resp.json();
    if (data.success) {
      alert(`Orden ${orderId} guardada en el servidor ✅`);
      setOrderItems([]);
      setCustomerInfo({
        companyName: "",
        contact: "",
        phone: "",
        email: "",
        deliveryDate: "",
      });
    } else {
      alert("❌ Error al guardar la orden: " + data.error);
    }
  };

  /* ===========================
    JSX (UI)
   =========================== */
  return (
    <div className="bg-gray-100 min-h-screen p-8 font-sans">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Órdenes</h1>
          <div className="flex space-x-4 text-sm font-semibold text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">{ordersStats.pending}</span>
              <span>Pendientes</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">{ordersStats.inProcess}</span>
              <span>En Proceso</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">{ordersStats.completed}</span>
              <span>Completadas</span>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer info */}
            <div className="col-span-1 bg-gray-50 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <User className="mr-2" />
                Información del Cliente
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Empresa"
                  value={customerInfo.companyName}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Contacto"
                  value={customerInfo.contact}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, contact: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="date"
                  value={customerInfo.deliveryDate}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, deliveryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* Product selector & preview */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <ShoppingCart className="mr-2" />
                  Selección del Producto
                </h3>

                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={() => {
                      if (!products.length) return;
                      const idx = products.findIndex((p) => p.id === selectedProduct?.id);
                      const newIdx = (idx - 1 + products.length) % products.length;
                      setSelectedProduct(products[newIdx]);
                    }}
                    className="p-2 rounded bg-gray-100"
                  >
                    <ChevronLeft />
                  </button>

                  <div className="flex-1 text-center">
                    <select
                      value={selectedProduct?.id || ""}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const p = products.find((x) => x.id === id) || null;
                        setSelectedProduct(p);
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.basePrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (!products.length) return;
                      const idx = products.findIndex((p) => p.id === selectedProduct?.id);
                      const newIdx = (idx + 1) % products.length;
                      setSelectedProduct(products[newIdx]);
                    }}
                    className="p-2 rounded bg-gray-100"
                  >
                    <ChevronRight />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-sm block mb-1">Talla</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-sm block mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm block mb-1">Logo del cliente</label>
                  <div className="flex items-center space-x-2">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                    {logoFile && (
                      <img
                        src={logoFile}
                        alt="logo"
                        style={{ width: 40, height: 40, objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Haz clic en la vista previa para posicionar el logo.
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleAddToOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                  >
                    <Plus className="mr-2" /> Agregar a la Orden
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Eye className="mr-2" /> Vista Previa
                </h3>
                <div style={{ width: 400, height: 400 }}>
                  <ProductPreview
                    product={selectedProduct}
                    color="#FFFFFF"
                    logo={logoFile}
                    logoPos={logoPosition}
                    onClickPosition={handlePreviewClickPosition}
                    imageUrl={selectedProduct?.image}
                    id={"preview-selected"}
                    width={400}
                    height={400}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order items summary */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="mr-2" /> Resumen de la Orden
            </h2>

            {orderItems.length === 0 ? (
              <p className="text-gray-500">No hay productos en la orden.</p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center bg-white rounded p-4 shadow"
                  >
                    {/* Miniatura visible */}
                    <div
                      className="flex-shrink-0 border rounded-lg shadow-sm"
                      style={{ width: 100, height: 100, marginRight: 12 }}
                    >
                      <ProductPreview
                        product={it.product}
                        color={it.color}
                        logo={it.logo}
                        logoPos={it.logoPosition}
                        imageUrl={it.product.image}
                        width={100}
                        height={100}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{it.product.name}</div>
                          <div className="text-sm text-gray-600">Talla: {it.size}</div>
                          <div className="text-sm text-gray-600">
                            Precio: ${it.product.basePrice}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${it.subtotal}</div>
                          <button
                            onClick={() => removeOrderItem(it.id)}
                            className="text-red-500 mt-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-2">
                        <label className="text-sm">Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            updateOrderItem(
                              it.id,
                              "quantity",
                              Number(e.target.value) || 1
                            )
                          }
                          className="w-20 px-2 py-1 border rounded"
                        />
                        {it.logo && (
                          <span className="text-sm text-green-600 ml-4">
                            Logo personalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 🔒 Preview oculto */}
                    <div
                      id={`hidden-preview-${it.id}`}
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        top: 0,
                        width: 400,
                        height: 400,
                      }}
                    >
                      <ProductPreview
                        product={it.product}
                        color={it.color}
                        logo={it.logo}
                        logoPos={it.logoPosition}
                        imageUrl={it.product.image}
                        width={400}
                        height={400}
                      />
                    </div>
                  </div>
                ))}

                {/* Total y botón exportar */}
                <div className="mt-4 flex justify-end items-center space-x-4">
                  <div className="text-xl font-bold">Total: ${getTotalOrder()}</div>
                  <button
                    onClick={exportOrder}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                  >
                    <Save className="mr-2" /> Guardar Orden (Exportar)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementSystem;
