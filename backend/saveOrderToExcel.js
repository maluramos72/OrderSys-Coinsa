const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');

exports.saveOrderToExcel = async (order, items) => {
    const excelDir = path.join(__dirname, '..', 'excel'); 
    const filePath = path.join(excelDir, 'orderData.xlsx');

    const workbook = new ExcelJS.Workbook();
    let worksheet;

    try {
        await fs.mkdir(excelDir, { recursive: true });
        
        // Verifica si el archivo existe antes de intentar leerlo
        const fileExists = await fs.stat(filePath).catch(() => false);
        
        if (fileExists) {
            await workbook.xlsx.readFile(filePath);
            // ✅ Intenta encontrar la hoja de cálculo por su nombre
            worksheet = workbook.getWorksheet('Orders');
        }

        // ✅ Si no existe la hoja 'Orders' (ya sea porque el archivo es nuevo o no se encontró)
        if (!worksheet) {
            worksheet = workbook.addWorksheet("Orders");
            worksheet.columns = [
                { header: "ID", key: "id", width: 15 },
                { header: "companyName", key: "companyName", width: 20 },
                { header: "contact", key: "contact", width: 20 },
                { header: "direction", key: "direction", width: 25 },
                { header: "email", key: "email", width: 25 },
                { header: "phone", key: "phone", width: 15 },
                { header: "deliveryDate", key: "deliveryDate", width: 15 },
                { header: "productName", key: "productName", width: 20 },
                { header: "linkImg", key: "linkImg", width: 40 },
                { header: "color", key: "color", width: 10 },
                { header: "size", key: "size", width: 10 },
                { header: "quantity", key: "quantity", width: 10 },
                { header: "basePrice", key: "basePrice", width: 10 },
                { header: "subtotal", key: "subtotal", width: 10 },
                { header: "status", key: "status", width: 15 },
                { header: "logo", key: "logo", width: 40 }, // ✅ Agregamos columna para logo
            ];
        }

        items.forEach((item) => {
            worksheet.addRow({
                id: order.id,
                companyName: order.customer.companyName,
                contact: order.customer.contact,
                direction: order.customer.direction ?? "N/A",
                email: order.customer.email,
                phone: order.customer.phone,
                deliveryDate: order.customer.deliveryDate,
                productName: item.product.name,
                linkImg: item.linkImg || "N/A", // ✅ Manejo de caso cuando no hay imagen
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                basePrice: item.product.basePrice,
                subtotal: item.subtotal,
                status: order.status,
                logo: item.logo || "N/A", // ✅ Guardamos el logo del cliente
            });
        });

        await workbook.xlsx.writeFile(filePath);
        console.log(`✅ Datos de la orden ${order.id} añadidos al archivo de Excel.`);
        
        return { success: true, filePath }; // ✅ Retornamos confirmación
        
    } catch (error) {
        console.error('❌ Error al manipular el archivo de Excel:', error);
        throw error;
    }
};