# Librerías y Dependencias

**Versión:** 2.1.0  
**Última actualización:** 11 de mayo de 2026  
**Total de dependencias:** 27 (15 backend + 12 frontend)

---

## Tabla de Contenidos

1. [Backend - Dependencias](#backend---dependencias)
2. [Frontend - Dependencias](#frontend---dependencias)
3. [Resumen](#resumen)

---

## Backend - Dependencias

| Librería | Versión | Propósito |
|----------|---------|----------|
| **express** | ^4.18.2 | Framework web para API REST |
| **pg** | ^8.9.0 | Cliente PostgreSQL |
| **postgres** | ^3.4.9 | Cliente PostgreSQL moderno |
| **jsonwebtoken** | ^9.0.0 | Autenticación JWT |
| **bcryptjs** | ^2.4.3 | Hash y encriptación de contraseñas |
| **dotenv** | ^16.0.3 | Variables de entorno (.env) |
| **cors** | ^2.8.5 | Control de CORS |
| **multer** | ^1.4.5-lts.1 | Manejo de cargas de archivos |
| **pdfkit** | ^0.13.0 | Generación de PDFs |
| **@react-pdf/renderer** | ^4.3.2 | Renderizar React a PDF |
| **exceljs** | ^4.4.0 | Lectura y escritura de Excel |
| **json2csv** | ^6.0.0-alpha.2 | Conversión JSON a CSV |
| **sharp** | ^0.34.5 | Procesamiento de imágenes |
| **uuid** | ^9.0.0 | Generación de IDs únicos |
| **moment** | ^2.29.4 | Manipulación de fechas |
| **@sendgrid/mail** | ^8.1.6 | Envío de emails |

### DevDependencies Backend

| Librería | Versión | Propósito |
|----------|---------|----------|
| **nodemon** | ^2.0.22 | Reiniciar servidor en desarrollo |
| **jest** | ^29.5.0 | Framework de testing |

---

## Frontend - Dependencias

| Librería | Versión | Propósito |
|----------|---------|----------|
| **react** | ^18.2.0 | Librería UI |
| **react-dom** | ^18.2.0 | Renderización React al DOM |
| **react-router-dom** | ^6.10.0 | Enrutamiento para SPA |
| **axios** | ^1.3.5 | Cliente HTTP |
| **chart.js** | ^4.2.1 | Gráficos |
| **react-chartjs-2** | ^5.2.0 | Integración Chart.js con React |
| **recharts** | ^3.7.0 | Gráficos modernos para React |
| **date-fns** | ^2.29.3 | Manipulación de fechas |
| **jspdf** | ^2.5.1 | Generación de PDFs |
| **html2pdf.js** | ^0.10.1 | Convertir HTML a PDF |
| **uuid** | ^9.0.0 | Generación de IDs únicos |
| **@supabase/supabase-js** | ^2.103.0 | Cliente Supabase |

### DevDependencies Frontend

| Librería | Versión | Propósito |
|----------|---------|----------|
| **react-scripts** | ^5.0.1 | Build y scripts de Create React App |

---

## Resumen

### Backend (16 dependencias)
- **Framework:** Express
- **BD:** PostgreSQL (pg + postgres)
- **Seguridad:** JWT + bcryptjs
- **Archivos:** Multer, Sharp
- **Documentos:** PDFKit, ExcelJS, JSON2CSV
- **Email:** SendGrid
- **Utilidades:** UUID, moment, dotenv, CORS

### Frontend (13 dependencias)
- **Core:** React + React Router
- **HTTP:** Axios
- **Gráficos:** Chart.js + Recharts
- **Documentos:** jsPDF, html2pdf
- **Fechas:** date-fns
- **Utilidades:** UUID, Supabase

**Total: 27 dependencias de producción**

---

*Última actualización: 11 de mayo de 2026*
