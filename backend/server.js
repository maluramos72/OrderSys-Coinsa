const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "100mb" }));

// Carpetas base
const ordersDir = path.join(__dirname, "public", "orders", "db");   // Excel
const imgDir = path.join(__dirname, "public", "orders", "imgs");    // Imágenes

// Crear carpetas si no existen
if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

// Servir imágenes estáticas
app.use("/orders/imgs", express.static(imgDir));

/**
 * Helper para guardar imágenes base64 en disco
 */
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

app.post("/api/saveOrder", async (req, res) => {
  const { order, items } = req.body;
  const imagesSaved = [];
  
  // ✅ Validación de datos del cliente y fecha de entrega
  if (!order.customer.companyName || !order.customer.contact || !order.customer.phone || !order.customer.email || !order.customer.deliveryDate) {
    return res.status(400).json({ success: false, message: 'Faltan datos de cliente o la fecha de entrega.' });
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
      { header: "linkImg", key: "linkImg", width: 30 },
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
          publicImgUrl = `/orders/imgs/${filename}`;
        }
      }

      worksheet.addRow({
        id: `${order.id}-${idx + 1}`,
        companyName: order.customer.companyName,
        contact: order.customer.contact,
        phone: order.customer.phone,
        email: order.customer.email,
        deliveryDate: order.customer.deliveryDate || "",
        productName: item.product.name,
        linkImg: publicImgUrl,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        basePrice: item.product.basePrice,
        subtotal: item.subtotal,
        status: order.status,
      });
    });

    // Guardar Excel en carpeta por orden
    const excelPath = path.join(ordersDir, `orderData-${order.id}.xlsx`);
    await workbook.xlsx.writeFile(excelPath);

    console.log(`✅ Server: orden ${order.id} guardada en ${excelPath}`);
    console.log(`   └─ Filas: ${items.length}, Imágenes: ${imagesSaved.length}`);

    res.json({
      success: true,
      message: `Orden ${order.id} guardada.`,
      excelPath: `/orders/db/orderData-${order.id}.xlsx`,
      images: imagesSaved,
    });
  } catch (err) {
    console.error("❌ Error en /api/saveOrder:", err);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

// Endpoint para obtener las órdenes
app.get("/api/getOrders", async (req, res) => {
  try {
    const excelFiles = await fs.readdir(ordersDir);
    const orders = [];

    for (const file of excelFiles) {
      if (file.endsWith(".xlsx")) {
        const filePath = path.join(ordersDir, file);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        if (worksheet) {
          worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) {
              const rowData = row.values;
              orders.push({
                id: rowData[1],
                companyName: rowData[2],
                contact: rowData[3],
                phone: rowData[4],
                email: rowData[5],
                deliveryDate: rowData[6],
                productName: rowData[7],
                linkImg: rowData[8],
                color: rowData[9],
                size: rowData[10],
                quantity: rowData[11],
                basePrice: rowData[12],
                subtotal: rowData[13],
                status: rowData[14],
              });
            }
          });
        }
      }
    }
    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Error al leer los archivos de Excel:", err);
    res.status(500).json({ success: false, message: "Error al cargar las órdenes." });
  }
});

// 📂 Endpoint para listar todas las órdenes disponibles
const exceljs = require("exceljs");

// Listar órdenes (solo nombres de archivo)
app.get("/api/listOrders", (req, res) => {
  try {
    const files = fs.readdirSync(path.join(__dirname, "public", "orders", "db"));
    const orderFiles = files.filter((f) => f.endsWith(".xlsx"));
    res.json({ success: true, orders: orderFiles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Leer orden específica
app.get("/api/getOrder/:id", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "public", "orders", "db", `orderData-${req.params.id}.xlsx`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Orden no encontrada" });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("Orders");

    const rows = worksheet.getSheetValues().slice(2); // quitar encabezados
    const data = rows.map((row) => ({
      id: row[1],
      companyName: row[2],
      contact: row[3],
      phone: row[4],
      email: row[5],
      deliveryDate: row[6],
      productName: row[7],
      linkImg: row[8],
      color: row[9],
      size: row[10],
      quantity: row[11],
      basePrice: row[12],
      subtotal: row[13],
      status: row[14],
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar estatus de una orden
app.post("/api/updateOrderStatus", async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const filePath = path.join(__dirname, "public", "orders", "db", `orderData-${orderId}.xlsx`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Orden no encontrada" });
    }

    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet("Orders");

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // omitir encabezados
        row.getCell("N").value = status; // columna "status"
      }
    });

    await workbook.xlsx.writeFile(filePath);
    res.json({ success: true, message: `Estatus de orden ${orderId} actualizado a ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
});