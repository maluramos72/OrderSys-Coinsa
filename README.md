# OrderSys-Coinsa
Un sistema de gestión de órdenes de producción para el sector textil, diseñado para optimizar el registro de pedidos, la personalización de productos y el seguimiento de pedidos.
Sistema de gestión de órdenes con React (frontend) y Node.js + Express (backend).
Permite crear órdenes, exportarlas con imágenes y productos, y administrarlas en un dashboard.
---

### Características 📋

* **Gestión de Productos:** Administra una base de datos de productos (camisetas, pantalones, etc.) con sus precios base.
* **Personalización:** Permite seleccionar colores y agregar un logo personalizado a cada prenda.
* **Creación de Órdenes:** Genera órdenes de trabajo con múltiples productos y detalles del cliente.
* **Generación de Archivos:** Exporta automáticamente los detalles de la orden a un archivo de Excel (`orderData.xlsx`) y guarda las vistas previas de los productos en formato PNG.

---
### Requisitos previos 🚀

1. Instalar Git

    Descarga Git desde 👉 https://git-scm.com/download/win
    
    Ejecuta el instalador (deja todo por defecto, clic en "Next").
    
    Reinicia tu terminal (PowerShell o Git Bash).  / comando del sistema
    
    Verifica que está instalado:
    
    git --version

2. Instalar Node.js

    Descarga Node.js LTS desde 👉 https://nodejs.org/en/download
    
    Instálalo (deja la opción de agregar a PATH marcada).
    
    Verifica que está instalado:  / comando del sistema
    
    node -v
    npm -v

### Requisitos de Instalación 🛠️

1.  Clona el repositorio:
    ```bash / comando del sistema
    git clone https://github.com/maluramos72/OrderSys-Coinsa.git
    cd OrderSys-Coinsa
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

### Cómo correr el proyecto ▶️

Iniciar backend (API y guardado de órdenes):

cd backend
node server.js


Debes ver:

✅ Server escuchando en http://localhost:5000


Iniciar frontend:
En otra terminal:

cd OrderSys-Coinsa
npm start


✅ El frontend abrirá en 👉 http://localhost:3000   

▶️Aqui se trabajará con el dashboard

---

### Estructura del Proyecto 📂

OrderSys-Coinsa/
├── backend/                # Servidor Node.js
│   ├── server.js           # API principal
│   ├── public/orders/db/   # Archivos de órdenes
│   └── public/orders/imgs/ # Imágenes de productos de órdenes
├── src/
│   ├── components/         # Componentes React
│   └── order-management-system.tsx
├── public/                 # Archivos estáticos (CSV, imágenes base)
└── README.md               # Este archivo

---

### Tecnologías Utilizadas 💻

* **Frontend:** React, HTML2Canvas, PapaParse
* **Backend:** Node.js, Express, ExcelJS, Multer
