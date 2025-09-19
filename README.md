# OrderSys-Coinsa
Un sistema de gestión de órdenes de producción para el sector textil, diseñado para optimizar el registro de pedidos, la personalización de productos y el seguimiento de pedidos.
---

### Características 📋

* **Gestión de Productos:** Administra una base de datos de productos (camisetas, pantalones, etc.) con sus precios base.
* **Personalización:** Permite seleccionar colores y agregar un logo personalizado a cada prenda.
* **Creación de Órdenes:** Genera órdenes de trabajo con múltiples productos y detalles del cliente.
* **Generación de Archivos:** Exporta automáticamente los detalles de la orden a un archivo de Excel (`orderData.xlsx`) y guarda las vistas previas de los productos en formato PNG.

---

### Requisitos de Instalación 🛠️

Asegúrate de tener instalado [Node.js] en tu sistema.

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/maluramos72/OrderSys-Coinsa.git
    cd [nombre-del-repositorio]
    ```

2.  Instala las dependencias del frontend:
    ```bash
    cd OrderSys-Coinsa
    npm install
    ```
3.  Instala las dependencias del backend:
    ```bash
    cd backend
    npm install
    ```

---

### Uso 🚀

1.  Inicia el servidor backend:
    ```bash
    node server.js
    ```
2.  Inicia la aplicación frontend:
    ```bash
    npm start
    ```
3.  Abre tu navegador y navega a `http://localhost:3000`.

---

### Estructura del Proyecto 📂

-   `src/components/`: Contiene los componentes de React para la interfaz de usuario.
-   `src/components/db/`: Almacena la base de datos de productos y el archivo de órdenes.
-   `src/components/imgs/`: Guarda las imágenes de los productos.
-   `server.js`: El script del servidor (Node.js/Express) para manejar la lógica de negocio y guardar los archivos.
-   `package.json`: Lista las dependencias del proyecto.

---

### Tecnologías Utilizadas 💻

* **Frontend:** React, HTML2Canvas, PapaParse
* **Backend:** Node.js, Express, ExcelJS, Multer
