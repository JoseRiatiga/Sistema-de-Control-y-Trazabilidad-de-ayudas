# Manual Técnico - Sistema de Control y Trazabilidad de Ayudas Humanitarias

**Versión:** 2.1.0  
**Última actualización:** 11 de mayo de 2026  
**Autor:** Sistema de Ayudas  
**Estado:** Producción

---

## Resumen Ejecutivo

Este manual técnico proporciona la documentación completa para el desarrollo, instalación, configuración y mantenimiento del **Sistema de Control y Trazabilidad de Ayudas Humanitarias**. El documento está dirigido a desarrolladores, administradores de sistemas y personal técnico responsable de la implementación y operación del sistema.

El sistema está compuesto por:
- **Backend:** Servidor Express.js con API REST
- **Frontend:** Interfaz web desarrollada en React
- **Base de Datos:** PostgreSQL para persistencia de datos
- **Funcionalidades principales:** Registro de beneficiarios, entregas de ayuda, inventario, auditoría y generación de reportes

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Despliegue en Producción](#despliegue-en-producción)
5. [Instalación](#instalación)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Configuración de Base de Datos](#configuración-de-base-de-datos)
8. [Ejecución del Proyecto](#ejecución-del-proyecto)
9. [Guía de Desarrollo](#guía-de-desarrollo)
10. [API Endpoints](#api-endpoints)
11. [Autenticación y Seguridad](#autenticación-y-seguridad)
12. [Troubleshooting](#troubleshooting)
13. [Mejores Prácticas](#mejores-prácticas)
14. [Recursos Adicionales](#recursos-adicionales)
15. [Conclusiones](#conclusiones)

---

## Requisitos Previos

### Software Requerido

- **Node.js**: v14.0.0 o superior
- **npm**: v6.0.0 o superior
- **PostgreSQL**: v12.0 o superior
- **Git**: v2.25.0 o superior
- **Visual Studio Code** (Recomendado para desarrollo)

### Conocimientos Necesarios

- JavaScript/ES6+
- React (para frontend)
- Express.js (para backend)
- SQL y PostgreSQL
- REST API
- JWT (JSON Web Tokens)
- Git y control de versiones

### Hardware Mínimo

- CPU: 2 núcleos
- RAM: 4GB (8GB recomendado)
- Disco: 2GB de espacio disponible

---

## Configuración del Entorno

### 1. Preparar Variables de Entorno

#### Backend (.env)

Crear archivo `backend/.env`:

```env
# Puerto del servidor
PORT=5000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=ayudas_db

# JWT
JWT_SECRET=tu_secret_jwt_super_seguro_con_caracteres_aleatorios
JWT_EXPIRY=7d

# Email (SendGrid)
SENDGRID_API_KEY=tu_api_key_sendgrid
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Node Environment
NODE_ENV=development

# Multer (Subida de archivos)
UPLOAD_DIR=./assets/uploads
MAX_FILE_SIZE=10485760
```

#### Frontend (.env)

Crear archivo `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

### 2. Verificar Instalación de PostgreSQL

```bash
# Windows
psql --version

# Verificar que el servicio esté corriendo
# Windows: Services.msc -> PostgreSQL
```

### 3. Verificar Instalación de Node.js

```bash
node --version
npm --version
```

---

## Despliegue en Producción

El proyecto está configurado para desplegarse en servicios en la nube utilizando **Vercel**, **Render** y **Supabase**. Esta sección cubre la configuración y despliegue en estos servicios.

### 1. Supabase - Base de Datos en la Nube

**Supabase** es una alternativa de código abierto a Firebase que proporciona PostgreSQL alojado en la nube.

#### Paso 1: Crear Cuenta en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear una cuenta o iniciar sesión
3. Crear un nuevo proyecto:
   - Nombre del proyecto: `ayudas-db`
   - Región: Seleccionar cercana a los usuarios (ej: `South America (São Paulo)`)
   - Contraseña de base de datos: Generar una contraseña segura

#### Paso 2: Obtener Credenciales de Conexión

En el dashboard de Supabase:

1. Ir a **Settings > Database**
2. Copiar los datos de conexión:
   - **Host:** `[proyecto].supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** La contraseña ingresada al crear el proyecto
   - **Connection String:** Disponible en la sección de conexión

```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

#### Paso 3: Variables de Entorno para Supabase

Agregar a `backend/.env`:

```env
# Supabase (Producción)
DB_HOST=tu-proyecto.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_supabase
DB_NAME=postgres
DB_SSL=true

# O usar connection string
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

#### Paso 4: Ejecutar Migraciones en Supabase

```bash
# Conectarse a Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"

# Ejecutar scripts SQL
\i database/schema.sql
\i database/seeds.sql
```

#### Paso 5: Verificar Conexión

```bash
# Desde backend
cd backend
node -e "require('./db').query('SELECT NOW()').then(r => console.log('✓ Supabase OK'))"
```

---

### 2. Render - Despliegue del Backend

**Render** es una plataforma moderna para desplegar aplicaciones Node.js, Python, y más.

#### Paso 1: Crear Cuenta en Render

1. Ir a [render.com](https://render.com)
2. Crear una cuenta o iniciar sesión
3. Conectar cuenta de GitHub

#### Paso 2: Crear Servicio Web

1. En el dashboard, hacer clic en **New +**
2. Seleccionar **Web Service**
3. Conectar repositorio de GitHub (si es privado)
4. Configurar:
   - **Name:** `ayudas-api`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** `production`

#### Paso 3: Configurar Variables de Entorno

En Render, ir a **Environment**:

```env
NODE_ENV=production
PORT=3000

# Base de datos (Supabase)
DB_HOST=tu-proyecto.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_supabase
DB_NAME=postgres
DB_SSL=true

# JWT
JWT_SECRET=tu_secret_jwt_seguro_aleatorio
JWT_EXPIRY=7d

# Email
SENDGRID_API_KEY=tu_api_key_sendgrid
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# URLs
FRONTEND_URL=https://tu-frontend.vercel.app
BACKEND_URL=https://tu-api.render.com

# CORS
CORS_ORIGIN=https://tu-frontend.vercel.app
```

#### Paso 4: Desplegar

1. Hacer commit y push a GitHub
2. Render desplegará automáticamente
3. La URL del servicio será: `https://ayudas-api.render.com`

#### Paso 5: Conectar Base de Datos

En Render, hacer clic en **Connect Database**:

- Seleccionar **Use external database**
- Ingresa credenciales de Supabase
- Seleccionar la conexión

**Nota:** Para la versión gratuita de Render, los servicios se hibernan después de 15 minutos de inactividad.

---

### 3. Vercel - Despliegue del Frontend

**Vercel** es la plataforma oficial para desplegar aplicaciones Next.js y React.

#### Paso 1: Crear Cuenta en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Crear una cuenta o iniciar sesión
3. Conectar cuenta de GitHub

#### Paso 2: Importar Proyecto

1. Hacer clic en **New Project**
2. Importar repositorio de GitHub
3. Seleccionar la rama (normalmente `main`)

#### Paso 3: Configurar el Proyecto

Vercel detectará automáticamente:
- **Framework Preset:** React
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`

Configurar manualmente si es necesario.

#### Paso 4: Configurar Variables de Entorno

En Vercel, ir a **Settings > Environment Variables**:

```env
REACT_APP_API_URL=https://tu-api.render.com/api
REACT_APP_ENVIRONMENT=production
```

**Importante:** Las variables de React deben comenzar con `REACT_APP_`

#### Paso 5: Desplegar

1. Hacer clic en **Deploy**
2. Vercel construirá y desplegará automáticamente
3. La URL será: `https://tu-frontend.vercel.app`

#### Configuración de Dominios (Opcional)

Para usar un dominio personalizado:

1. Ir a **Settings > Domains**
2. Agregar dominio personalizado
3. Actualizar registros DNS según las instrucciones de Vercel

---

### 4. Configuración de Despliegue Automático (CI/CD)

Todos los servicios se despliegan automáticamente cuando haces push a GitHub:

#### Vercel - Frontend
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# ↓ Vercel despliega automáticamente
```

#### Render - Backend
```bash
git add .
git commit -m "feat: nuevo endpoint"
git push origin main
# ↓ Render despliega automáticamente
```

#### Supabase - Base de Datos
Los cambios en la BD se realizan ejecutando scripts SQL manualmente o través de migraciones.

---

### 5. Variables de Entorno Completas por Ambiente

#### Desarrollo Local

**backend/.env:**
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_local
DB_NAME=ayudas_db
JWT_SECRET=secret_desarrollo
FRONTEND_URL=http://localhost:3000
```

**frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

#### Producción (Render + Supabase)

**backend/.env (Render):**
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu-proyecto.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=[PASSWORD_SUPABASE]
DB_NAME=postgres
DB_SSL=true
JWT_SECRET=[RANDOM_SECURE_STRING]
FRONTEND_URL=https://tu-frontend.vercel.app
SENDGRID_API_KEY=[API_KEY]
CORS_ORIGIN=https://tu-frontend.vercel.app
```

**frontend/.env (Vercel):**
```env
REACT_APP_API_URL=https://tu-api.render.com/api
REACT_APP_ENVIRONMENT=production
```

---

### 6. Monitoreo y Logs

#### Render - Ver Logs

1. Dashboard de Render
2. Seleccionar el servicio `ayudas-api`
3. Tab **Logs** muestra en tiempo real

#### Vercel - Ver Logs

1. Dashboard de Vercel
2. Seleccionar el proyecto
3. Tab **Deployments > Logs** para ver el build
4. Consola del navegador para errores en runtime

#### Supabase - Ver Logs

1. Dashboard de Supabase
2. **Reports > Database** para monitoreo
3. **SQL Editor** para ejecutar queries

---

### 7. Troubleshooting de Despliegue

#### Error: "Cannot find module" en Render

**Causa:** Las dependencias no se instalaron correctamente

**Solución:**
```bash
# En Render, actualizar Build Command a:
npm install --legacy-peer-deps && cd frontend && npm install
```

#### Error: "CORs error" después de desplegar

**Causa:** Variables de entorno no están sincronizadas

**Solución:**
- Verificar que `CORS_ORIGIN` y `FRONTEND_URL` sean correctas en Render
- Verificar que `REACT_APP_API_URL` sea correcta en Vercel
- Redeploy después de cambiar variables

#### Render Service goes to sleep (versión gratuita)

**Causa:** Inactividad por 15 minutos

**Solución:** Usar plan pagado o mantener el servicio activo con pings periódicos

```javascript
// Backend - health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

```bash
# Hacer ping cada 14 minutos para evitar hibernación
*/14 * * * * curl https://tu-api.render.com/api/health
```

---

## Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd "Sistema de Control y Trazabilidad de ayudas"
```

### Paso 2: Instalar Dependencias del Backend

```bash
cd backend
npm install
```

**Dependencias Principales:**
- `express`: Framework web
- `pg`: Cliente PostgreSQL
- `jsonwebtoken`: Autenticación JWT
- `bcryptjs`: Encriptación de contraseñas
- `multer`: Manejo de archivos
- `pdfkit`: Generación de PDFs
- `exceljs`: Generación de Excel
- `dotenv`: Variables de entorno
- `cors`: Control de CORS

### Paso 3: Instalar Dependencias del Frontend

```bash
cd ../frontend
npm install
```

**Dependencias Principales:**
- `react`: Librería de UI
- `react-router-dom`: Enrutamiento
- `axios`: Cliente HTTP
- `chart.js` y `react-chartjs-2`: Gráficos
- `jspdf` y `html2pdf.js`: Generación de PDFs
- `date-fns`: Manipulación de fechas

### Paso 4: Configurar la Base de Datos

Ver sección [Configuración de Base de Datos](#configuración-de-base-de-datos)

---

## Estructura del Proyecto

### Árbol de Directorios Completo

```
Sistema de Control y Trazabilidad de ayudas/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Punto de entrada del backend
│   │   ├── controllers/
│   │   │   └── index.js              # Controladores principales
│   │   ├── models/
│   │   │   └── index.js              # Modelos de datos
│   │   ├── routes/
│   │   │   ├── aids.js               # Rutas de entregas de ayuda
│   │   │   ├── audit.js              # Rutas de auditoría
│   │   │   ├── auth.js               # Rutas de autenticación
│   │   │   ├── censo.js              # Rutas de beneficiarios
│   │   │   ├── inventory.js          # Rutas de inventario
│   │   │   ├── receipts.js           # Rutas de comprobantes
│   │   │   └── reports.js            # Rutas de reportes
│   │   ├── middleware/
│   │   │   └── auth.js               # Middleware de autenticación
│   │   └── utils/
│   │       ├── auditLogger.js        # Logger de auditoría
│   │       ├── emailService.js       # Servicio de emails
│   │       └── reportTemplates.js    # Plantillas de reportes
│   ├── database/
│   │   ├── schema.sql                # Esquema de la BD
│   │   └── seeds.sql                 # Datos iniciales
│   ├── assets/
│   │   ├── images/                   # Imágenes estáticas
│   │   └── uploads/                  # Archivos subidos
│   ├── receipts/                     # Comprobantes generados
│   ├── .env                          # Variables de entorno
│   ├── package.json                  # Dependencias del backend
│   └── db.js                         # Configuración de base de datos
├── frontend/
│   ├── src/
│   │   ├── index.js                  # Punto de entrada
│   │   ├── App.js                    # Componente raíz
│   │   ├── components/
│   │   │   └── NavBar.js             # Barra de navegación
│   │   ├── pages/
│   │   │   ├── Home.js               # Página inicial
│   │   │   ├── Login.js              # Página de login
│   │   │   ├── Dashboard.js          # Dashboard principal
│   │   │   ├── AidRegistration.js    # Registro de entregas
│   │   │   ├── BeneficiaryManagement.js
│   │   │   ├── InventoryManagement.js
│   │   │   ├── AuditTrail.js         # Auditoría
│   │   │   ├── Reports.js            # Reportes
│   │   │   ├── UserManagement.js     # Gestión de usuarios
│   │   │   ├── Settings.js           # Configuración
│   │   │   ├── AlertEditModal.js     # Modal de alertas
│   │   │   └── AlertViewModal.js
│   │   ├── utils/
│   │   │   ├── apiConfig.js          # Configuración de API
│   │   │   ├── municipalities.js     # Lista de municipios
│   │   │   └── warehouseLocations.js # Ubicaciones de almacén
│   │   ├── App.css
│   │   ├── index.css
│   │   └── index.html
│   ├── public/
│   │   └── index.html
│   ├── build/                        # Build generado
│   ├── .env                          # Variables de entorno
│   ├── package.json                  # Dependencias del frontend
│   └── vercel.json                   # Configuración de Vercel
├── database/
│   ├── schema.sql                    # Esquema de la BD
│   └── seeds.sql                     # Datos de prueba
├── docs/
│   ├── API_REFERENCE.md              # Referencia de API
│   ├── ARQUITECTURA.md               # Diagrama de arquitectura
│   ├── INSTALACION.md                # Guía de instalación
│   └── MANUAL_TECNICO.md             # Este archivo
├── LICENSE
└── README.md
```

### Responsabilidades de Directorios

| Directorio | Responsabilidad |
|-----------|-----------------|
| `backend/src/controllers` | Lógica de negocio principal |
| `backend/src/models` | Modelos de datos y queries SQL |
| `backend/src/routes` | Definición de endpoints API |
| `backend/src/middleware` | Middleware de autenticación y validación |
| `backend/src/utils` | Funciones utilitarias reutilizables |
| `frontend/src/pages` | Componentes de página (vistas principales) |
| `frontend/src/components` | Componentes reutilizables |
| `frontend/src/utils` | Configuración y datos estáticos |
| `database/` | Esquema y datos iniciales de BD |

---

## Configuración de Base de Datos

### 1. Crear Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# En la consola de PostgreSQL
CREATE DATABASE ayudas_db;
\connect ayudas_db
```

### 2. Ejecutar Script de Esquema

```bash
# Desde la raíz del proyecto
psql -U postgres -d ayudas_db -f database/schema.sql
```

### 3. Cargar Datos Iniciales (Opcional)

```bash
psql -U postgres -d ayudas_db -f database/seeds.sql
```

### 4. Verificar Conexión desde el Backend

```bash
cd backend
node -e "require('./db').query('SELECT NOW()').then(r => console.log('✓ Conexión OK'))"
```

### Estructura de Tablas Principales

#### tabla: users
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- full_name (VARCHAR)
- role (ENUM: admin, auditor, operator)
- municipality (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### tabla: censados (Beneficiarios)
```sql
- id (UUID, PK)
- document_number (VARCHAR, UNIQUE)
- full_name (VARCHAR)
- address (TEXT)
- municipality (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- created_at (TIMESTAMP)
```

#### tabla: aid_deliveries
```sql
- id (UUID, PK)
- censado_id (FK)
- aid_type (VARCHAR)
- quantity (INTEGER)
- delivery_date (TIMESTAMP)
- operator_id (FK)
- notes (TEXT)
- created_at (TIMESTAMP)
```

#### tabla: duplicate_alerts
```sql
- id (UUID, PK)
- aid_delivery_id (FK)
- status (ENUM: pending, reviewed, resolved)
- notes (TEXT)
- created_at (TIMESTAMP)
- reviewed_at (TIMESTAMP)
```

#### tabla: audit_logs
```sql
- id (UUID, PK)
- user_id (FK)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (UUID)
- changes (JSONB)
- timestamp (TIMESTAMP)
```

---

## Ejecución del Proyecto

### Opción 1: Ejecución en Desarrollo

#### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

**Salida esperada:**
```
Server running on http://localhost:5000
Database connected successfully
```

#### Terminal 2 - Frontend

```bash
cd frontend
npm start
```

**Salida esperada:**
```
Compiled successfully!
You can now view ayudas-frontend in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Opción 2: Ejecución en Producción

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
# Los archivos estáticos están en frontend/build
```

### Scripts Disponibles

#### Backend

```bash
npm start      # Ejecutar servidor
npm run dev    # Ejecutar con nodemon (recarga automática)
npm test       # Ejecutar pruebas
npm run migrate # Ejecutar migraciones
```

#### Frontend

```bash
npm start      # Ejecutar en desarrollo
npm run build  # Crear build de producción
npm test       # Ejecutar pruebas
npm eject      # Exponer configuración (irreversible)
```

---

## Guía de Desarrollo

### 1. Crear un Nuevo Endpoint API

#### Paso 1: Crear Ruta en `routes/`

```javascript
// backend/src/routes/ejemplo.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'GET /api/ejemplo' });
});

router.post('/', authenticateToken, (req, res) => {
  // Lógica POST
  res.json({ message: 'POST /api/ejemplo' });
});

module.exports = router;
```

#### Paso 2: Registrar Ruta en `server.js`

```javascript
// backend/src/server.js
const ejemploRoutes = require('./routes/ejemplo');
app.use('/api/ejemplo', ejemploRoutes);
```

### 2. Crear un Nuevo Componente React

```javascript
// frontend/src/pages/EjemploPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EjemploPage.css';

const EjemploPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/ejemplo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="ejemplo-page">
      {/* Contenido */}
    </div>
  );
};

export default EjemploPage;
```

### 3. Estructura de Respuesta API

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Operación completada exitosamente"
}
```

**Respuesta de Error:**
```json
{
  "success": false,
  "error": "Código de error",
  "message": "Descripción del error",
  "details": { /* información adicional */ }
}
```

### 4. Convenciones de Código

#### Backend (Express.js)

- **Nombres de archivos**: snake_case.js
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Indentación**: 2 espacios
- **Punto y coma**: Obligatorio

```javascript
const TIMEOUT_MS = 5000;
const userData = { name: 'Juan', age: 30 };

function getUserById(id) {
  // lógica
}
```

#### Frontend (React)

- **Nombres de componentes**: PascalCase.js
- **CSS**: PascalCase.css
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Props**: Desestructuración recomendada

```javascript
const UserCard = ({ userId, userName }) => {
  const CARD_WIDTH = 300;
  
  return <div className="user-card">{userName}</div>;
};
```

### 5. Manejo de Errores

#### Backend

```javascript
try {
  const result = await query('SELECT * FROM users');
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Database error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Error interno del servidor' 
  });
}
```

#### Frontend

```javascript
try {
  const response = await axios.get('/api/users');
  setUsers(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // Redirigir a login
  } else if (error.response?.status === 403) {
    setError('No tienes permiso para esta acción');
  } else {
    setError(error.message);
  }
}
```

---

## API Endpoints

### Autenticación

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

### Beneficiarios (Censo)

```
GET    /api/censo                    # Listar beneficiarios
POST   /api/censo                    # Crear beneficiario
GET    /api/censo/:id                # Obtener beneficiario
PUT    /api/censo/:id                # Actualizar beneficiario
DELETE /api/censo/:id                # Eliminar beneficiario
GET    /api/censo/search/:document   # Buscar por documento
```

### Entregas de Ayuda

```
GET    /api/aids                     # Listar entregas
POST   /api/aids                     # Registrar entrega
GET    /api/aids/:id                 # Obtener entrega
PUT    /api/aids/:id                 # Actualizar entrega
DELETE /api/aids/:id                 # Eliminar entrega
```

### Inventario

```
GET    /api/inventory                # Listar inventario
POST   /api/inventory                # Crear item
PUT    /api/inventory/:id            # Actualizar item
DELETE /api/inventory/:id            # Eliminar item
GET    /api/inventory/low-stock      # Items con bajo stock
```

### Auditoría

```
GET    /api/audit                    # Listar logs de auditoría
GET    /api/audit/:id                # Detalle de log
GET    /api/audit/filter             # Filtrar logs
```

### Reportes

```
GET    /api/reports                  # Listar reportes
POST   /api/reports                  # Generar reporte
GET    /api/reports/export/:format   # Exportar reporte
```

### Comprobantes

```
GET    /api/receipts/:id             # Obtener comprobante
GET    /api/receipts/pdf/:id         # Descargar PDF
POST   /api/receipts/resend/:id      # Reenviar comprobante
```

Ver documento [API_REFERENCE.md](API_REFERENCE.md) para detalles completos de cada endpoint.

---

## Autenticación y Seguridad

### 1. Flujo de Autenticación JWT

```
1. Usuario ingresa credenciales
   ↓
2. Backend valida contra BD
   ↓
3. Si válido, genera JWT token
   ↓
4. Cliente almacena token en localStorage
   ↓
5. Cliente envía token en header Authorization
   ↓
6. Backend verifica token en cada request
   ↓
7. Si válido, continúa; si no, rechaza con 401
```

### 2. Estructura del JWT

```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { 
  "userId": "uuid",
  "email": "usuario@ejemplo.com",
  "role": "operator",
  "iat": timestamp,
  "exp": timestamp
}
Signature: HMACSHA256(header + payload + secret)
```

### 3. Middleware de Autenticación

```javascript
// backend/src/middleware/auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

### 4. Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total, gestión de usuarios, configuración |
| **auditor** | Ver datos, generar reportes, revisar alertas |
| **operator** | Registrar entregas, ver su propios datos |

### 5. Mejores Prácticas de Seguridad

- ✅ Usar HTTPS en producción
- ✅ Validar todas las entradas
- ✅ Usar tokens JWT con expiración
- ✅ Hash de contraseñas con bcryptjs
- ✅ Implementar rate limiting
- ✅ Sanitizar datos en la BD
- ✅ Usar CORS configurado correctamente
- ✅ No exponer errores sensibles al cliente
- ✅ Auditar todas las operaciones críticas
- ✅ Mantener dependencias actualizadas

---

## Troubleshooting

### Error: ECONNREFUSED - No se puede conectar a PostgreSQL

**Causa:** El servicio PostgreSQL no está corriendo

**Solución:**
```bash
# Windows
net start postgresql-x64-XX

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql
```

**Verificar estado:**
```bash
psql -U postgres -c "SELECT version();"
```

### Error: ENOENT - Cannot find module

**Causa:** Dependencias no instaladas

**Solución:**
```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: JWT token expired

**Causa:** El token ha expirado

**Solución:** Implementar refresh token
```javascript
// Frontend
const refreshToken = async () => {
  const response = await axios.post('/api/auth/refresh', {
    token: localStorage.getItem('token')
  });
  localStorage.setItem('token', response.data.token);
};
```

### Error: CORS blocked

**Causa:** Configuración de CORS incorrecta

**Solución:**
```javascript
// backend/src/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Error: Port 5000 already in use

**Causa:** Otro proceso usa el puerto

**Solución:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5000
kill -9 <PID>
```

### Base de datos llena o corrupta

**Solución:**
```bash
# Hacer backup
pg_dump -U postgres ayudas_db > backup.sql

# Restaurar desde backup
psql -U postgres ayudas_db < backup.sql

# O reinicializar (PELIGRO: borra todos los datos)
psql -U postgres -d ayudas_db -f database/schema.sql
```

### Frontend no se conecta al backend

**Causas posibles:**
- Backend no está corriendo
- CORS no configurado
- URL incorrecta en .env

**Verificar:**
```javascript
// frontend/src/utils/apiConfig.js
console.log('API URL:', process.env.REACT_APP_API_URL);

// En navegador - verificar conexión
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

### Base de datos muestra caracteres extraños

**Causa:** Encoding UTF-8 no configurado

**Solución:**
```sql
-- Verificar encoding
SELECT datname, pg_encoding_to_char(encoding) 
FROM pg_database 
WHERE datname = 'ayudas_db';

-- Si no es UTF8, recrear BD
DROP DATABASE ayudas_db;
CREATE DATABASE ayudas_db 
  WITH ENCODING 'UTF8' LC_COLLATE 'es_ES.UTF-8' LC_CTYPE 'es_ES.UTF-8';
```

---

## Mejores Prácticas

### 1. Control de Versiones

```bash
# Workflow recomendado
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git add .
git commit -m "feat: descripción clara del cambio"
git push origin feature/nueva-funcionalidad
# Crear Pull Request

# Mensajes de commit
feat: Agregar nueva funcionalidad
fix: Reparar bug específico
docs: Actualizar documentación
style: Cambios de formato (sin lógica)
refactor: Refactorización de código
perf: Mejoras de rendimiento
test: Agregar o actualizar tests
```

### 2. Gestión de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar parches
npm update

# Actualizar a versiones mayores (cuidado)
npm install -g npm-check-updates
ncu -u
npm install

# Auditar vulnerabilidades
npm audit
npm audit fix
```

### 3. Testing

```bash
# Backend - crear tests en __tests__/
npm test

# Frontend - crear tests en src/__tests__/
npm test
```

Ejemplo de test backend:
```javascript
// backend/__tests__/users.test.js
const request = require('supertest');
const app = require('../src/server');

describe('Users API', () => {
  it('should get users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

### 4. Logging y Monitoreo

```javascript
// backend/src/utils/logger.js
const fs = require('fs');
const path = require('path');

const logToFile = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${level}: ${message} ${JSON.stringify(data)}\n`;
  
  fs.appendFileSync(
    path.join(__dirname, '../../logs/app.log'),
    log
  );
};

module.exports = { logToFile };
```

### 5. Performance

#### Backend
- Usar índices en BD para campos frecuentemente consultados
- Implementar paginación en endpoints que retornan muchos registros
- Cachear datos estáticos
- Usar connection pooling

#### Frontend
- Code splitting en React
- Lazy loading de componentes
- Compresión de imágenes
- Minificación en build de producción

```javascript
// React - Lazy loading
const AuditTrail = React.lazy(() => import('./pages/AuditTrail'));

<Suspense fallback={<div>Cargando...</div>}>
  <AuditTrail />
</Suspense>
```

### 6. Documentación

- Mantener README.md actualizado
- Documentar cambios significativos en CHANGELOG
- Usar comentarios en código complejo
- Mantener este manual técnico actualizado

```javascript
/**
 * Calcula el total de entregas por municipio
 * @param {string} municipality - Nombre del municipio
 * @param {Date} startDate - Fecha inicial del rango
 * @param {Date} endDate - Fecha final del rango
 * @returns {Promise<number>} Total de entregas
 * @throws {Error} Si el municipio no existe
 */
async function getTotalAidsByMunicipality(municipality, startDate, endDate) {
  // implementación
}
```

### 7. Environment Management

```bash
# Diferentes configuraciones por ambiente
.env                 # Local development
.env.staging         # Staging
.env.production      # Production

# Cargar según ambiente
NODE_ENV=production npm start
```

### 8. Backup y Recuperación

```bash
# Backup diario de BD
0 2 * * * pg_dump -U postgres ayudas_db | gzip > /backups/ayudas_db_$(date +\%Y\%m\%d).sql.gz

# Restaurar desde backup
gunzip -c /backups/ayudas_db_20260511.sql.gz | psql -U postgres ayudas_db
```

---

## Recursos Adicionales

### Documentación Interna
- [Referencia de API](API_REFERENCE.md)
- [Arquitectura del Sistema](ARQUITECTURA.md)
- [Guía de Instalación](INSTALACION.md)

### Documentación Externa
- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT Introduction](https://jwt.io/introduction)

### Herramientas Útiles
- [Postman](https://www.postman.com) - Testing de APIs
- [DBeaver](https://dbeaver.io) - Gestor visual de BD
- [VS Code](https://code.visualstudio.com) - Editor de código

### Comunidades y Soporte
- [Stack Overflow](https://stackoverflow.com)
- [Node.js Community](https://nodejs.org/en/community)
- [PostgreSQL Community](https://www.postgresql.org/community)

---

---

## Conclusiones

Este manual técnico proporciona una base sólida para el desarrollo y mantenimiento del Sistema de Control y Trazabilidad de Ayudas Humanitarias. Los puntos clave a tener en cuenta son:

1. **Instalación Correcta**: Seguir los pasos de instalación garantiza un entorno de desarrollo estable
2. **Seguridad**: La autenticación JWT y los roles de usuario son fundamentales para proteger los datos
3. **Documentación**: Mantener la documentación actualizada es crítico para el mantenimiento del sistema
4. **Testing**: Implementar pruebas unitarias e integración mejora la calidad del código
5. **Monitoreo**: El logging y auditoría son esenciales para detectar problemas

### Próximas Mejoras Recomendadas

- Implementar testing automatizado (Jest)
- Agregar containerización con Docker
- Implementar integración continua (CI/CD)
- Expandir cobertura de pruebas
- Implementar monitoreo y alertas en producción
- Agregar documentación de API con Swagger

---

## Changelog

### v2.1.0 - 11 de mayo de 2026
- ✅ Manual técnico inicial
- ✅ Instrucciones de instalación y configuración
- ✅ Guía de desarrollo
- ✅ Troubleshooting extenso
- ✅ Mejores prácticas
- ✅ Resumen ejecutivo y conclusiones
- ✅ Sincronización de versiones con README.md
- ✅ Despliegue en Supabase (BD)
- ✅ Despliegue en Render (Backend)
- ✅ Despliegue en Vercel (Frontend)
- ✅ Configuración de CI/CD automático
- ✅ Variables de entorno para producción
- ✅ Monitoreo y troubleshooting de despliegue

---

## Contacto y Soporte

Para reportar problemas o sugerencias sobre este manual:
1. Crear un issue en el repositorio
2. Contactar al equipo de desarrollo
3. Revisar los logs en `backend/logs/` y `frontend/console`

**Última revisión:** 11 de mayo de 2026

---

## Anexos

### A. Comandos Útiles Rápidos

```bash
# Instalar todo desde cero
git clone <url>
cd backend && npm install
cd ../frontend && npm install

# Ejecutar en desarrollo
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start

# Ejecutar tests
cd backend && npm test
cd frontend && npm test

# Limpiar node_modules y reinstalar
cd backend && rm -rf node_modules package-lock.json && npm install
```

### B. Estructura de Directorios Rápida

```
📦 Proyecto
├── 📁 backend/          # Servidor Express
│   ├── 📁 src/          # Código fuente
│   │   ├── routes/      # Definición de endpoints
│   │   ├── models/      # Queries a BD
│   │   ├── controllers/ # Lógica de negocio
│   │   └── middleware/  # Autenticación, validación
│   ├── 📁 database/     # Scripts SQL
│   └── 📁 assets/       # Archivos estáticos
├── 📁 frontend/         # Cliente React
│   ├── 📁 src/
│   │   ├── pages/       # Componentes de página
│   │   ├── components/  # Componentes reutilizables
│   │   └── utils/       # Configuración y helpers
│   └── 📁 build/        # Build generado
└── 📁 docs/             # Documentación
```

---

*Este manual técnico es un documento vivo y debe ser actualizado conforme evolucione el sistema.*
