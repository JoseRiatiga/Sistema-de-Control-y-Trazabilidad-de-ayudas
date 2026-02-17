# Sistema de Control y Trazabilidad de Ayudas Humanitarias

Sistema integral para la gestión, control y auditoría de ayudas humanitarias con enfoque en transparencia y prevención de duplicidades.

## Características Principales

### 1. Registro de Ayudas
- Registro digital de todas las ayudas entregadas
- Vinculación automática con base de censados
- Generación de recibos digitales firmables
- Trazabilidad completa del proceso

### 2. Control de Inventario
- Gestión centralizada de inventario por municipio
- Seguimiento de cantidad y ubicación
- Cálculo de valores totales
- Alertas de stock bajo

### 3. Asignación por Familia
- Validación contra base de censados
- Información de familia completa
- Historial de entregas por beneficiario
- Datos geográficos de ubicación

### 4. Alertas de Duplicidad
- Detección automática de entregas repetidas
- Alertas configurables por período
- Bloqueo de entregas sospechosas
- Revisión y resolución de alertas

### 5. Bitácora de Entregas
- Registro completo de todas las entregas
- Información del operador responsable
- Fecha, hora y cantidad
- Municipio y observaciones

### 6. Reportes por Municipio
- Reportes de entregas por período
- Análisis de inventario
- Datos de beneficiarios asistidos
- Exportación a CSV

### 7. Auditoría y Control
- Registro de todos los cambios en el sistema
- Identificación de usuario responsable
- Comparativa antes/después
- Reportes para entes de control

### 8. Comprobantes Digitales
- Generación de PDF con firma digital
- Hash de verificación para autenticidad
- Firma del operador y beneficiario
- Descarga y almacenamiento

## Estructura del Proyecto

```
Sistema de Control y Trazabilidad de ayudas/
├── backend/                    # Servidor Node.js/Express
│   ├── src/
│   │   ├── server.js          # Aplicación principal
│   │   ├── controllers/       # Lógica de negocio
│   │   ├── models/            # Modelos de datos
│   │   ├── routes/            # Rutas de API
│   │   ├── middleware/        # Middlewares (auth, audit)
│   │   ├── services/          # Servicios
│   │   └── utils/             # Utilidades
│   ├── package.json           # Dependencias
│   └── .env.example           # Variables de entorno
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── App.js             # Componente principal
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas/vistas
│   │   ├── services/          # Servicios HTTP
│   │   ├── context/           # Context API
│   │   └── index.js           # Punto de entrada
│   └── package.json           # Dependencias
├── database/
│   ├── schema.sql             # Esquema de base de datos
│   ├── migrations/            # Scripts de migración
│   └── seeds/                 # Datos iniciales
└── docs/                      # Documentación
```

## Roles y Permisos

### Administrador (admin)
- Crear usuarios
- Crear tipos de ayuda
- Crear inventario
- Ver todos los reportes
- Acceso completo a auditoría
- Resolver alertas

### Operador (operador)
- Registrar entregas
- Ver inventario
- Generar comprobantes
- Ver entregas de su municipio

### Auditor (auditor)
- Ver alertas de duplicidad
- Acceso a bitácoras
- Generar reportes
- No puede crear/modificar entregas

## Instalación

### Requisitos
- Node.js 14+
- PostgreSQL 12+
- npm o yarn

### Backend

1. Navegar a la carpeta backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con las credenciales de PostgreSQL
```

4. Crear base de datos:
```bash
createdb ayudas_humanitarias
psql -U postgres -d ayudas_humanitarias -f ../database/schema.sql
```

5. Iniciar servidor:
```bash
npm start
# O en desarrollo
npm run dev
```

El servidor estará disponible en http://localhost:5000

### Frontend

1. Navegar a la carpeta frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar aplicación:
```bash
npm start
```

La aplicación se abrirá en http://localhost:3000

## Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil

### Censo (Beneficiarios)
- `POST /api/censo` - Crear beneficiario
- `GET /api/censo` - Listar beneficiarios
- `GET /api/censo/:id` - Obtener beneficiario
- `GET /api/censo/municipality/:municipality` - Beneficiarios por municipio
- `GET /api/censo/identification/:identification` - Buscar por cédula

### Ayudas
- `POST /api/aids/types` - Crear tipo de ayuda
- `GET /api/aids/types` - Listar tipos
- `POST /api/aids/delivery` - Registrar entrega
- `GET /api/aids/delivery` - Listar entregas
- `GET /api/aids/delivery/beneficiary/:censado_id` - Entregas de beneficiario
- `GET /api/aids/delivery/municipality/:municipality` - Entregas por municipio

### Inventario
- `POST /api/inventory` - Crear inventario
- `GET /api/inventory` - Listar inventario
- `GET /api/inventory/municipality/:municipality` - Inventario por municipio
- `PATCH /api/inventory/:id` - Actualizar cantidad

### Auditoría
- `GET /api/audit/duplicate-alerts` - Alertas de duplicidad
- `GET /api/audit/delivery-log` - Bitácora de entregas
- `GET /api/audit/change-log` - Registro de cambios
- `PATCH /api/audit/duplicate-alerts/:id` - Actualizar alerta

### Reportes
- `GET /api/reports/deliveries` - Reporte de entregas
- `GET /api/reports/inventory` - Reporte de inventario
- `GET /api/reports/beneficiaries` - Reporte de beneficiarios
- `GET /api/reports/duplicate-alerts` - Reporte de alertas
- `GET /api/reports/control-entities` - Reporte para entes de control

### Comprobantes
- `POST /api/receipts/:deliveryId` - Generar comprobante
- `GET /api/receipts/:receiptId` - Obtener comprobante
- `GET /api/receipts/:receiptId/download` - Descargar PDF

## Datos de Ejemplo

Para crear un usuario de prueba:

```json
POST /api/auth/register
{
  "name": "Juan Operador",
  "email": "operador@example.com",
  "password": "password123",
  "role": "operador",
  "phone": "555-1234",
  "municipality": "La Paz"
}
```

## Seguridad

- Contraseñas hasheadas con bcryptjs
- Autenticación con JWT
- Roles y permisos por endpoint
- Auditoría completa de cambios
- Hash de verificación en comprobantes

## Soporte

Para reportar bugs o solicitar features, contacte al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Última actualización:** 17 de febrero de 2026
