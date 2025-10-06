// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "200mb" }));

// Rutas base
const ordersDir = path.join(__dirname, "public", "orders", "db");   // Excel
const imgDir = path.join(__dirname, "public", "orders", "imgs");    // Imágenes

if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

// Servir imágenes estáticas
app.use("/orders/imgs", express.static(imgDir));

/* Helper: guardar imagen base64 */
function saveBase64Image(base64Data, filePath) {
  if (!base64Data || typeof base64Data !== "string") return false;
  const base64Image = base64Data.split(";base64,").pop();
  try {
    fs.writeFileSync(filePath, Buffer.from(base64Image, "base64"));
    return true;
  } catch (err) {
    console.error("Error al guardar la imagen:", err);
    return false;
  }
}

/* Endpoint para guardar orden (mantener tu lógica actual) */
app.post("/api/saveOrder", async (req, res) => {
  const { order, items } = req.body;
  const imagesSaved = [];

  // Validación mínima
  if (!order || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Orden o items inválidos." });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");
    worksheet.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "companyName", key: "companyName", width: 20 },
      { header: "contact", key: "contact", width: 20 },
      { header: "phone", key: "phone", width: 15 },
      { header: "email", key: "email", width: 25 },
      { header: "deliveryDate", key: "deliveryDate", width: 15 },
      { header: "productName", key: "productName", width: 20 },
      { header: "linkImg", key: "linkImg", width: 60 },
      { header: "color", key: "color", width: 10 },
      { header: "size", key: "size", width: 10 },
      { header: "quantity", key: "quantity", width: 10 },
      { header: "basePrice", key: "basePrice", width: 10 },
      { header: "subtotal", key: "subtotal", width: 10 },
      { header: "status", key: "status", width: 15 },
    ];

    items.forEach((item, idx) => {
      let publicImgUrl = "";
      if (item.previewImage) {
        const filename = `order-preview-${order.id}-${idx + 1}.png`;
        const imgPath = path.join(imgDir, filename);
        const ok = saveBase64Image(item.previewImage, imgPath);
        if (ok) {
          imagesSaved.push(filename);
          // guardamos ruta relativa (puede guardarse absoluta si prefieres)
          publicImgUrl = `/orders/imgs/${filename}`;
        }
      }

      worksheet.addRow({
        id: `${order.id}-${idx + 1}`,
        companyName: order.customer?.companyName || "",
        contact: order.customer?.contact || "",
        phone: order.customer?.phone || "",
        email: order.customer?.email || "",
        deliveryDate: order.customer?.deliveryDate || "",
        productName: item.product?.name || item.productName || "",
        linkImg: publicImgUrl,
        color: item.color || "",
        size: item.size || "",
        quantity: Number(item.quantity) || 0,
        basePrice: Number(item.basePrice || (item.product && item.product.basePrice) || 0),
        subtotal: Number(item.subtotal) || 0,
        status: order.status || "Pendiente",
      });
    });

    const excelPath = path.join(ordersDir, `orderData-${order.id}.xlsx`);
    await workbook.xlsx.writeFile(excelPath);

    console.log(`✅ Orden ${order.id} guardada. Imágenes: ${imagesSaved.length}`);
    res.json({
      success: true,
      message: `Orden ${order.id} guardada.`,
      excelPath: `/orders/db/orderData-${order.id}.xlsx`,
      images: imagesSaved,
    });
  } catch (err) {
    console.error("❌ Error en /api/saveOrder:", err);
    res.status(500).json({ success: false, message: "Error interno." });
  }
});


/* GET /api/listOrders -> devuelve lista de archivos */
app.get("/api/listOrders", (req, res) => {
  try {
    const files = fs.readdirSync(ordersDir);
    const orderFiles = files.filter((f) => f.endsWith(".xlsx"));
    res.json({ success: true, orders: orderFiles });
  } catch (err) {
    console.error("Error listOrders:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* GET /api/getOrder/:id -> lee archivo excel y normaliza linkImg */
app.get("/api/getOrder/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const filePath = path.join(ordersDir, `orderData-${orderId}.xlsx`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Orden no encontrada" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("Orders") || workbook.getWorksheet(1);

    const items = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // encabezado
      const vals = row.values; // array con índices empezando en 1
      // safe access
      const rawLink = (vals && vals[8]) ? String(vals[8]).trim() : "";
      let normalizedLink = rawLink;

      // Normalizar: si es relativa (/orders/...) la hacemos absoluta con host
      if (normalizedLink && normalizedLink.startsWith("/")) {
        const host = `${req.protocol}://${req.get("host")}`;
        normalizedLink = `${host}${normalizedLink}`;
      }

      // Si no hay link en Excel intentamos buscar archivo en imgDir
      if (!normalizedLink) {
        try {
          const candidates = fs.readdirSync(imgDir).filter((f) =>
            f.startsWith(`order-preview-${orderId}-`)
          );
          if (candidates.length > 0) {
            const chosen = candidates[0];
            const host = `${req.protocol}://${req.get("host")}`;
            normalizedLink = `${host}/orders/imgs/${chosen}`;
          }
        } catch (e) {
          // ignore
        }
      }

      const item = {
        id: vals[1] || "",
        companyName: vals[2] || "",
        contact: vals[3] || "",
        phone: vals[4] || "",
        email: vals[5] || "",
        deliveryDate: vals[6] || "",
        productName: vals[7] || "",
        linkImg: normalizedLink || "",
        color: vals[9] || "",
        size: vals[10] || "",
        quantity: Number(vals[11] || 0),
        basePrice: Number(vals[12] || 0),
        subtotal: Number(vals[13] || 0),
        status: vals[14] || "",
      };

      console.log("➡️ Fila leída:", {
        rawLink,
        normalizedLink,
        productName: item.productName,
        id: item.id,
      });

      items.push(item);
    });

    console.log(`📤 /api/getOrder/${orderId} -> items: ${items.length}`);
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("❌ Error en /api/getOrder/:id", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/* POST updateOrderStatus (mantener) */
app.post("/api/updateOrderStatus", async (req, res) => {
  const { orderId, status } = req.body;
  try {
    const filePath = path.join(ordersDir, `orderData-${orderId}.xlsx`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Orden no encontrada" });
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("Orders") || workbook.getWorksheet(1);

    // Actualizamos la columna status para todas las filas
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(14).value = status; // columna N = 14
      }
    });

    await workbook.xlsx.writeFile(filePath);
    res.json({ success: true, message: `Orden ${orderId} actualizada a ${status}` });
  } catch (err) {
    console.error("Error updateOrderStatus:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
});
