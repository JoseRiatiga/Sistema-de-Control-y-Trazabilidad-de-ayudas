# Sistema de Control y Trazabilidad de Ayudas Humanitarias

Sistema integral para la gestión, control y auditoría de ayudas humanitarias con enfoque en transparencia y prevención de duplicidades.

**Versión:** 1.0.0  
**Estado:** ✅ Completamente funcional  
**Última actualización:** 18 de febrero de 2026

## Características Principales

### 1. Registro de Ayudas
- Registro digital de todas las ayudas entregadas
- Vinculación automática con base de censados (Censo)
- Generación de comprobantes (Recibos) digitales en PDF
- Trazabilidad completa del proceso
- Verificación automática de stock disponible
- Detección automática de entregas duplicadas
- Soporte para múltiples tipos de ayuda por registro
- Agrupación de entregas en comprobante único

### 2. Control de Inventario
- Gestión centralizada de inventario por municipio
- Seguimiento en tiempo real de cantidad disponible
- Indicadores visuales de disponibilidad (✓/✗)
- Cálculo automático de stock
- Ubicación de almacenes por municipio
- Actualización inmediata tras entregas

### 3. Gestión de Beneficiarios
- Base de datos de censados (beneficiarios)
- Búsqueda por cédula de identidad
- Información de ubicación geográfica
- Historial completo de entregas
- Validación automática de datos

### 4. Alertas de Duplicidad
- Detección automática de entregas repetidas
- Período configurable de verificación (últimas 30 días)
- Sistema de alertas en tiempo real
- Interfaz de revisión y resolución
- Anotaciones de auditoría en alertas

### 5. Bitácora Completa de Entregas
- Registro de todas las entregas (tabla: entregas_ayuda)
- Información del operador responsable
- Fecha, hora y cantidad exact
- Municipio y observaciones
- Desglose de múltiples items por entrega
- Búsqueda y filtrado avanzado

### 6. Reportes Flexibles
- Reporte de entregas (CSV exportable)
- Reporte de inventario (CSV exportable)
- Reporte de beneficiarios (CSV exportable)
- Reporte de alertas de duplicidad (CSV exportable)
- Reporte para entes de control (CSV exportable)
- Filtros por municipio y rangos de fecha
- Codificación UTF-8 con BOM para Excel

### 7. Auditoría y Control
- Registro completo de todos los cambios (tabla: bitacora_auditoria)
- Identificación del usuario responsable
- Comparativa antes/después en JSON
- Visualización profesional en interfaz
- Traducción de nombres de tablas a español
- Reportes para entes de control con formato ejecutivo

### 8. Comprobantes Digitales (PDF)
- Generación automática de comprobantes en PDF
- Número único de comprobante sequencial
- Información del operador y beneficiario
- Tabla de ítems entregados
- Fecha y hora de generación
- Formato profesional imprimible
- Un comprobante por evento de registro (agrupa múltiples ítems)

## Stack Tecnológico

### Backend
- **Runtime:** Node.js con Express 4.18.2
- **Base de Datos:** PostgreSQL 12+
- **Autenticación:** JWT (jsonwebtoken 9.0.0)
- **Encriptación:** bcryptjs 2.4.3 para contraseñas
- **PDF Generation:** PDFKit 0.13.0
- **Gestión de Ambiente:** dotenv 16.0.3
- **CORS:** cors 2.8.5
- **Otros:** uuid 9.0.0, pg 8.9.0, moment 2.29.4, multer 1.4.5

**Dependencias de desarrollo:** nodemon 2.0.22, jest 29.5.0

### Frontend
- **Framework:** React 18.2.0
- **Enrutamiento:** React Router v6.10.0
- **HTTP Client:** Axios 1.3.5 (con autenticación JWT)
- **Gráficos:** Chart.js 4.2.1, react-chartjs-2 5.2.0, recharts 3.7.0
- **PDF:** jsPDF 2.5.1, html2pdf.js 0.10.1
- **Fechas:** date-fns 2.29.3
- **Otros:** uuid 9.0.0

**Build Tool:** react-scripts 5.0.1

### Base de Datos
- **Motor:** PostgreSQL 12+ (con conexión pooling)
- **Tablas principales:** 
  - usuarios
  - censados (beneficiarios)
  - tipos_ayuda
  - inventario
  - entregas_ayuda
  - alertas_duplicidad
  - bitacora_auditoria
  - comprobantes_entrega

## Estructura del Proyecto

```
Sistema de Control y Trazabilidad de ayudas/
├── backend/                         # Servidor Node.js/Express
│   ├── src/
│   │   ├── server.js               # Aplicación principal (puerto 5000)
│   │   ├── controllers/            # Lógica de negocio
│   │   │   └── index.js
│   │   ├── models/                 # Modelos de datos
│   │   │   └── index.js
│   │   ├── routes/                 # Rutas de API (7 archivos)
│   │   │   ├── auth.js             # Autenticación
│   │   │   ├── aids.js             # Entregas y tipos de ayuda
│   │   │   ├── censo.js            # Beneficiarios
│   │   │   ├── inventory.js        # Gestión de inventario
│   │   │   ├── audit.js            # Auditoría y alertas
│   │   │   ├── reports.js          # Reportes y exportación CSV
│   │   │   └── receipts.js         # Generación de comprobantes PDF
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT, roles, auditoría, detección duplicados
│   │   ├── services/               # Servicios (vacío, lógica en controllers)
│   │   └── utils/                  # Utilidades
│   ├── package.json                # Dependencias backend
│   └── .env.example                # Variables de entorno
│
├── frontend/                        # Aplicación React (puerto 3000)
│   ├── src/
│   │   ├── App.js                  # Enrutamiento principal
│   │   ├── App.css                 # Estilos globales
│   │   ├── index.js                # Punto de entrada
│   │   ├── index.css               # Estilos base
│   │   ├── components/
│   │   │   ├── NavBar.js           # Barra de navegación
│   │   │   └── NavBar.css
│   │   ├── pages/                  # 11 páginas/vistas
│   │   │   ├── Login.js            # Autenticación (email/contraseña)
│   │   │   ├── Login.css
│   │   │   ├── Home.js             # Página de inicio
│   │   │   ├── Home.css
│   │   │   ├── Dashboard.js        # Panel de estadísticas
│   │   │   ├── Dashboard.css
│   │   │   ├── AidRegistration.js  # Registrar entregas
│   │   │   ├── AidRegistration.css # Con validation y stock check
│   │   │   ├── InventoryManagement.js  # Gestión inventario
│   │   │   ├── InventoryManagement.css
│   │   │   ├── BeneficiaryManagement.js # Gestión de censo
│   │   │   ├── BeneficiaryManagement.css
│   │   │   ├── Reports.js          # Reportes y exportación CSV
│   │   │   ├── Reports.css
│   │   │   ├── AuditTrail.js       # Bitácora de auditoría
│   │   │   ├── AuditTrail.css
│   │   │   ├── UserManagement.js   # Crear usuarios (admin)
│   │   │   ├── UserManagement.css
│   │   │   ├── Settings.js         # Configuración de tema
│   │   │   ├── Settings.css
│   │   │   ├── AlertEditModal.js   # Modal para resolver alertas
│   │   │   ├── AlertEditModal.css
│   │   │   └── AlertViewModal.js   # Modal para ver alertas
│   │   ├── services/               # Servicios HTTP
│   │   ├── context/                # Context API (vacío)
│   │   └── public/index.html
│   └── package.json                # Dependencias frontend
│
├── database/
│   ├── schema.sql                  # Esquema 9 tablas + 2 vistas + 11 índices
│   ├── seeds.sql                   # Datos iniciales
│   ├── migrations/                 # (vacío)
│   └── seeds/                      # (vacío)
│
├── docs/                           # Documentación técnica
│   ├── API_REFERENCE.md
│   ├── INSTALACION.md
│   └── ARQUITECTURA.md
│
├── .gitignore
├── README.md                       # Este archivo
└── .env.example
```

## Roles y Permisos

### Administrador (`administrador`)
- ✅ Crear y gestionar usuarios del sistema
- ✅ Crear tipos de ayuda
- ✅ Crear y actualizar inventario por municipio
- ✅ Registrar entregas de ayuda
- ✅ Ver todos los reportes (entregas, inventario, beneficiarios, etc.)
- ✅ Acceso completo a auditoría y bitácora
- ✅ Ver y resolver alertas de duplicidad
- ✅ Cambiar contraseña
- ✅ Gestionar configuración del sistema

### Operador (`operador`)
- ✅ Registrar entregas de ayuda (su municipio)
- ✅ Consultar inventario disponible
- ✅ Generar comprobantes (recibos PDF)
- ✅ Ver entregas de su municipio
- ✅ Gestionar beneficiarios/censo (búsqueda)
- ✅ Cambiar contraseña
- ❌ No puede crear usuarios
- ❌ No puede ver auditoría completa
- ❌ No puede ver reportes administrativos

### Auditor (`auditor`)
- ✅ Ver alertas de duplicidad
- ✅ Acceso a bitácoras de entregas
- ✅ Generar reportes administrativos
- ✅ Acceso a auditoría completa
- ✅ Cambiar contraseña
- ❌ No puede crear/modificar entregas
- ❌ No puede crear usuarios
- ❌ No puede gestionar inventario

## Instalación

### Requisitos del Sistema
- **Node.js:** 14+ (probado con v18+)
- **npm:** 6+ (incluido con Node.js)
- **PostgreSQL:** 12+ con usuario `postgres`
- **SO:** Windows 10+, macOS, Linux
- **Puertos:** 5000 (backend), 3000 (frontend), 5432 (PostgreSQL)

### Diferencias por SO
Estas instrucciones son **agnósticas de SO**. Para Windows, PowerShell funciona perfectamente con los comandos bash.

### Paso 1: Configurar Base de Datos

**En PowerShell/Terminal:**

```bash
# Crear base de datos
createdb ayudas_humanitarias

# Crear esquema y tablas
psql -U postgres -d ayudas_humanitaria -f database/schema.sql

# Cargar datos iniciales
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql
```

Si PostgreSQL/psql no está en PATH:
```powershell
# En Windows, usa la ruta completa:
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d ayudas_humanitarias -f database\schema.sql
```

### Paso 2: Configurar y Ejecutar Backend

**En terminal 1:**

```bash
cd backend

# Instalar dependencias (express, pg, jsonwebtoken, bcryptjs, cors, pdfkit, etc.)
npm install

# Copiar archivo de configuración
cp .env.example .env
# (Windows PowerShell)
Copy-Item .env.example .env
```

**Editar `backend/.env`:**
```
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias
JWT_SECRET=tu_secreto_super_secreto_cambiar_en_produccion
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

**Iniciar servidor:**
```bash
# Desarrollo (con auto-reload)
npm run dev

# O Producción
npm start
```

✅ **Esperado:** `Servidor iniciado en puerto 5000`

Verificar en: http://localhost:5000/health

### Paso 3: Configurar y Ejecutar Frontend

**En terminal 2 (nueva terminal):**

```bash
cd frontend

# Instalar dependencias (React, Axios, Router, Chart.js, jsPDF, etc.)
npm install

# Iniciar desarrollo
npm start
```

✅ **Esperado:** Abre automáticamente http://localhost:3000

### Paso 4: Crear Usuario Inicial

**Opción A: En navegador (Recomendado)**  
1. Abre http://localhost:3000
2. Usa el endpoint `POST /api/auth/register` (si está disponible en UI)

**Opción B: Con curl/PowerShell**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Admin Usuario",
    "email":"admin@ayudas.com",
    "password":"password123",
    "role":"administrador",
    "municipality":"La Paz",
    "phone":"555-1234"
  }'
```

**PowerShell:**
```powershell
$body = @{
    name = "Admin Usuario"
    email = "admin@ayudas.com"
    password = "password123"
    role = "administrador"
    municipality = "La Paz"
    phone = "555-1234"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Deteniendo los Servicios

```bash
# Presiona Ctrl+C en ambas terminales

# O en PowerShell:
Get-Process -Name "node" | Stop-Process -Force
```

## API REST - Endpoints Completos

**Base URL:** `http://localhost:5000/api`

**Autenticación:** Bearer Token en header `Authorization: Bearer {token}`

### Autenticación (`/auth`)
```
POST   /auth/register                           # Registrar usuario (público)
POST   /auth/login                              # Iniciar sesión (público)
GET    /auth/profile                            # Obtener perfil del usuario actual
GET    /auth/users                              # Listar todos los usuarios (admin)
PUT    /auth/perfil/actualizar                  # Actualizar perfil usuario
PUT    /auth/perfil/cambiar-password            # Cambiar contraseña
GET    /auth/perfil/sesiones                    # Ver historial de sesiones
GET    /auth/perfil/estadisticas                # Estadísticas del usuario
POST   /auth/perfil/solicitar-eliminacion       # Solicitar eliminación de cuenta
POST   /auth/create-user                        # Crear usuario (solo admin)
DELETE /auth/delete-user/:id                    # Eliminar usuario (solo admin)
```

### Censo - Beneficiarios (`/censo`)
```
POST   /censo                                   # Crear beneficiario (admin/operador)
GET    /censo                                   # Listar todos los beneficiarios
GET    /censo/:id                               # Obtener detalles beneficiario
GET    /censo/municipality/:municipality        # Beneficiarios por municipio
GET    /censo/identification/:identification    # Buscar por cédula de identidad
PATCH  /censo/:id                               # Actualizar beneficiario
DELETE /censo/:id                               # Eliminar beneficiario (admin)
```

### Ayudas - Entregas (`/aids`)
```
POST   /aids/types                              # Crear tipo de ayuda (admin)
GET    /aids/types                              # Listar tipos de ayuda

POST   /aids/delivery                           # Registrar entrega (operador/admin)
       # Con validación de duplicados automática
       # Agrupa múltiples ítems en un comprobante único
GET    /aids/delivery                           # Listar todas las entregas
GET    /aids/delivery/beneficiary/:censado_id   # Entregas de un beneficiario
GET    /aids/delivery/municipality/:municipality # Entregas por municipio
DELETE /aids/delivery/:id                       # Eliminar entrega (admin)

GET    /aids/inventory-check/:aidTypeId/:municipality  # Verificar stock disponible
```

### Inventario (`/inventory`)
```
POST   /inventory                               # Crear inventario (admin)
GET    /inventory                               # Listar inventario completo
GET    /inventory/municipality/:municipality    # Inventario por municipio
PATCH  /inventory/:id                           # Actualizar cantidad (admin)
PUT    /inventory/:id                           # Actualizar inventario completo (admin)
DELETE /inventory/:id                           # Eliminar inventario (admin)
```

### Auditoría (`/audit`)
```
GET    /audit/duplicate-alerts                  # Listar alertas de duplicidad (auditor/admin)
GET    /audit/delivery-log                      # Bitácora de entregas (auditor/admin)
GET    /audit/change-log                        # Registro de cambios en el sistema (auditor/admin)
GET    /audit/summary                           # Resumen de auditoría (admin)
PATCH  /audit/duplicate-alerts/:id              # Resolver alerta (auditor/admin)
```

### Reportes (`/reports`) - CSV Exportable
```
GET    /reports/deliveries                      # Reporte entregas (auditor/admin)
GET    /reports/inventory                       # Reporte inventario
GET    /reports/beneficiaries                   # Reporte beneficiarios
GET    /reports/duplicate-alerts                # Reporte alertas duplicidad
GET    /reports/control-entities                # Reporte para entes control

Parámetros comunes:
  ?municipality=La Paz      # Filtrar por municipio
  ?dateFrom=2024-01-01      # Fecha inicio (YYYY-MM-DD)
  ?dateTo=2024-12-31        # Fecha fin
  
Respuestas: CSV con encoding UTF-8 BOM para Excel
```

### Comprobantes (`/receipts`) - PDF Generation
```
POST   /receipts/:deliveryId                    # Generar comprobante PDF
       Body: { signedByBeneficiary: bool, relatedDeliveries: [id1, id2, ...] }
       
GET    /receipts/:receiptId                     # Obtener datos del comprobante
GET    /receipts/:receiptId/download            # Descargar PDF
```

### Health Check
```
GET    /health                                  # Verificar servidor operativo
```

## Rutas Frontend

**Base URL:** `http://localhost:3000`

### Rutas Públicas
```
/ingreso                    # Login (email + password)
/                          # Redirige a /ingreso o /inicio según autenticación
```

### Rutas Protegidas (requieren autenticación)
```
/inicio                    # Home - Página de inicio general
/panel                     # Dashboard - Panel de estadísticas y estado del sistema
/registrar-ayuda           # Registrar entregas (operador/admin)
/inventario                # Gestión de inventario (operador/admin)
/beneficiarios             # Gestión de censo/beneficiarios (operador/admin)
/reportes                  # Generar y descargar reportes CSV (admin/auditor)
/auditorias                # Bitácora de auditoría y cambios (admin/auditor)
/usuarios                  # Crear y gestionar usuarios (solo admin)
/configuracion             # Configuración de tema y perfil (todos)
```

### Control de Acceso por Rol
- **administrador:** Acceso a todas las rutas
- **operador:** /inicio, /panel, /registrar-ayuda, /inventario, /beneficiarios, /configuracion
- **auditor:** /inicio, /panel, /reportes, /auditorias, /configuracion

## Datos de Ejemplo

### Crear Usuario de Prueba

**Con curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Operador",
    "email": "operador@lapaz@ayudas.com",
    "password": "password123",
    "role": "operador",
    "phone": "555-1234",
    "municipality": "La Paz"
  }'
```

**Con PowerShell:**
```powershell
$body = @{
    name = "Juan Operador"
    email = "operador.lapaz@ayudas.com"
    password = "password123"
    role = "operador"
    phone = "555-1234"
    municipality = "La Paz"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Iniciar Sesión

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operador.lapaz@ayudas.com",
    "password": "password123"
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": { "id": "...", "name": "Juan Operador", "role": "operador", ... }
# }
```

### Registrar Entrega

**Datos requeridos:**
```json
POST /api/aids/delivery
Authorization: Bearer {token}

{
  "censado_id": "uuid-del-beneficiario",
  "municipio": "La Paz",
  "aidItems": [
    {
      "tipo_ayuda_id": "uuid-tipo-1",
      "cantidad": 5
    },
    {
      "tipo_ayuda_id": "uuid-tipo-2",
      "cantidad": 2
    }
  ],
  "notas": "Entrega a beneficiario"
}
```

### Generar Reporte CSV

```bash
# Reporte de entregas con filtros
curl -X GET "http://localhost:5000/api/reports/deliveries?municipality=La Paz&dateFrom=2024-01-01&dateTo=2024-12-31" \
  -H "Authorization: Bearer {token}"

# Respuesta: Archivo CSV con BOM UTF-8 para Excel
```

## Seguridad Implementada

### Autenticación y Autorización
- ✅ **JWT (jsonwebtoken 9.0.0):** Tokens con expiración configurable
- ✅ **bcryptjs 2.4.3:** Hashing de contraseñas con salt rounds = 10
- ✅ **Verificación de rol:** Cada endpoint valida permisos del usuario
- ✅ **Middleware de autenticación:** verifyToken, verifyRole, setCurrentUser

### Validación de Datos
- ✅ **Detección automática de duplicados:** En tiempo real al registrar entregas
- ✅ **Validación de stock:** Verificación de inventario disponible
- ✅ **Parameterized queries:** Prevención de SQL injection en todas partes
- ✅ **Validación de entrada:** Tipos y formatos requeridos

### Auditoría
- ✅ **Bitácora completa:** Tabla `bitacora_auditoria` con todos los cambios
- ✅ **Identificación de usuario:** Cada acción registra quién la realizó
- ✅ **Valores antes/después:** JSON con datos anteriores y nuevos
- ✅ **Alertas de duplicidad:** Tabla `alertas_duplicidad` con autodetección

### Transmisión
- ✅ **CORS:** Controlado por variable `CORS_ORIGIN`
- ✅ **HTTPS ready:** Estructura preparada para producción con SSL
- ✅ **Timeouts:** Conexiones con límites configurables

## Características Técnicas Adicionales

### Generación de Comprobantes PDF
- ✅ **PDFKit 0.13.0:** Generación nativa en Node.js
- ✅ **Múltiples ítems:** Tabla con todos los items en un PDF
- ✅ **Información completa:** Operador, beneficiario, fecha, firma
- ✅ **Almacenamiento:** Directorio `/receipts` con número secuencial

### Exportación de Reportes CSV
- ✅ **UTF-8 BOM:** Compatibilidad con Excel
- ✅ **Columnas traducidas:** Nombres en español profesionales
- ✅ **Filtrado:** Municipio, rango de fechas
- ✅ **Formatos:** Fechas (dd/mm/yyyy), Moneda (2 decimales)

### Base de Datos PostgreSQL
- ✅ **9 tablas principales:** usuarios, censados, tipos_ayuda, inventario, entregas_ayuda, alertas_duplicidad, bitacora_auditoria, comprobantes_entrega, reportes
- ✅ **11 índices:** Optimización de búsquedas
- ✅ **2 vistas:** Consultas complejas pre-construidas
- ✅ **Pool de conexiones:** Reutilización eficiente de conexiones

### Frontend Moderno
- ✅ **React 18.2.0:** Hooks y Context API
- ✅ **React Router v6:** SPA con rutas protegidas
- ✅ **Axios 1.3.5:** HTTP client con interceptores de JWT
- ✅ **Tema dinámico:** Light/Dark mode con CSS variables
- ✅ **Gráficos:** Chart.js y Recharts para dashboards

## Variables de Entorno

### Backend (.env)
```
# Base de datos
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias

# Seguridad
JWT_SECRET=tu_secreto_super_largo_y_complejo_cambiar_en_produccion
JWT_EXPIRATION=7d

# Servidor
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Opcionales
LOG_LEVEL=debug
```

## Troubleshooting

### Error: "Cannot connect to database"
- Verificar PostgreSQL está ejecutándose
- Verificar credenciales en `.env`
- Verificar puerto 5432 está disponible

### Error: "Port 5000 already in use"
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### Error: "Token inválido" en frontend
- Limpiar localStorage: F12 → Application → Clear Storage
- Iniciar sesión nuevamente
- Verificar JWT_SECRET es igual en backend

### Reportes CSV no se descargan
- Verificar navegador permite descargas
- Verificar rol de usuario (admin/auditor)
- Revisar console del navegador (F12)

## Performance y Escalabilidad

### Optimizaciones Implementadas
- ✅ Index en campos de búsqueda frecuente (municipio, censado_id, fecha)
- ✅ Connection pooling en PostgreSQL
- ✅ Compresión de respuestas CORS
- ✅ Lazy loading en componentes React

### Capacidad Estimada
- **Entregas:** 100,000+ registros sin degradación
- **Usuarios:** Hasta 500 usuarios concurrentes
- **Reportes:** Generación CSV subsecond para 10,000 registros

## Soporte y Contribuciones

### Reportar Bugs
1. Describir el problema detalladamente
2. Incluir pasos para reproducir
3. Adjuntar capturas de pantalla si es relevante
4. Verificar logs en terminal/console

### Solicitar Features
- Crear issue con descripción clara
- Incluir caso de uso
- Sugerir alternativas si existen

---

**Sistema:** Sistema de Control y Trazabilidad de Ayudas Humanitarias  
**Versión:** 1.0.0  
**Estado:** Funcional  
**Última actualización:** 18 de febrero de 2026  
**Licencia:** ISC  
**Autor:** Jose Riatiga
