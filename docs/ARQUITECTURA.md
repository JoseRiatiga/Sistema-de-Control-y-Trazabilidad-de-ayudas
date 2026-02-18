# Sistema de Control y Trazabilidad de Ayudas Humanitarias

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                   Cliente Web (React)                       │
│  - Dashboard                                                │
│  - Registro de Entregas                                     │
│  - Gestión de Inventario                                    │
│  - Reportes                                                 │
│  - Auditoría                                                │
└────────────────┬──────────────────────────────────────────┘
                 │ HTTP/REST API
┌────────────────▼──────────────────────────────────────────┐
│          Servidor Backend (Express.js + Node.js)           │
├──────────────────────────────────────────────────────────┤
│  Routes:                                                   │
│  ├─ /api/auth (Autenticación)                            │
│  ├─ /api/censo (Beneficiarios)                           │
│  ├─ /api/aids (Entregas)                                 │
│  ├─ /api/inventory (Inventario)                          │
│  ├─ /api/audit (Auditoría)                               │
│  ├─ /api/reports (Reportes)                              │
│  └─ /api/receipts (Comprobantes)                         │
├──────────────────────────────────────────────────────────┤
│  Middleware:                                               │
│  ├─ JWT Authentication                                   │
│  ├─ Role-based Access Control                            │
│  ├─ Audit Logging                                        │
│  └─ Duplicate Detection                                  │
└────────────────┬──────────────────────────────────────────┘
                 │ SQL
┌────────────────▼──────────────────────────────────────────┐
│              Base de Datos PostgreSQL                       │
├──────────────────────────────────────────────────────────┤
│  Tablas:                                                   │
│  ├─ users (Usuarios del sistema)                         │
│  ├─ censados (Beneficiarios)                             │
│  ├─ aid_types (Tipos de ayuda)                           │
│  ├─ aid_deliveries (Entregas realizadas)                │
│  ├─ inventory (Inventario)                               │
│  ├─ duplicate_alerts (Alertas de duplicidad)             │
│  ├─ audit_logs (Registro de auditoría)                   │
│  ├─ delivery_receipt (Comprobantes)                      │
│  └─ reports (Reportes generados)                         │
└──────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Registro de Ayuda
```
Usuario (Operador)
    ↓
Interfaz Web
    ↓
Validar token JWT
    ↓
Buscar beneficiario en base de censados
    ↓
Verificar duplicidad en entregas últimas 30 días
    ↓
Registrar entrega en aid_deliveries
    ↓
Crear alerta si hay duplicidad
    ↓
Generar comprobante digital automáticamente
    ↓
Registrar en audit_logs
    ↓
Responder al cliente
```

### 2. Alerta de Duplicidad
```
Sistema detecta entrega repetida
    ↓
Crear registro en duplicate_alerts
    ↓
Cambiar estado a 'pending'
    ↓
Auditor revisa (pestaña Auditoría)
    ↓
Cambiar estado a 'reviewed' con notas
    ↓
Actualizar a 'resolved' cuando se confirma
    ↓
Información disponible en reportes
```

### 3. Generación de Reportes
```
Auditor solicita reporte
    ↓
Seleccionar filtros (municipio, fechas)
    ↓
Sistema consulta base de datos
    ↓
Generar datos del reporte
    ↓
Guardar en tabla reports
    ↓
Permitir descarga CSV
```

## Modelos de Datos

### Usuario (users)
```javascript
{
  id: UUID (PK),
  name: VARCHAR(255),
  email: VARCHAR(255) UNIQUE,
  password_hash: VARCHAR(255),
  role: ENUM('admin', 'operador', 'auditor'),
  phone: VARCHAR(20),
  municipality: VARCHAR(100),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  active: BOOLEAN
}
```

### Beneficiario (censados)
```javascript
{
  id: UUID (PK),
  identification: VARCHAR(20) UNIQUE,
  first_name: VARCHAR(100),
  last_name: VARCHAR(100),
  phone: VARCHAR(20),
  email: VARCHAR(255),
  address: VARCHAR(255),
  municipality: VARCHAR(100),
  latitude: DECIMAL,
  longitude: DECIMAL,
  family_members: INT,
  registered_at: TIMESTAMP
}
```

### Entrega (aid_deliveries)
```javascript
{
  id: UUID (PK),
  censado_id: UUID (FK → censados),
  aid_type_id: UUID (FK → aid_types),
  quantity: INT,
  delivery_date: TIMESTAMP,
  operator_id: UUID (FK → users),
  municipality: VARCHAR(100),
  notes: TEXT,
  receipt_number: VARCHAR(50) UNIQUE,
  created_at: TIMESTAMP
}
```

### Alerta (duplicate_alerts)
```javascript
{
  id: UUID (PK),
  censado_id: UUID (FK → censados),
  aid_type_id: UUID (FK → aid_types),
  last_delivery_date: TIMESTAMP,
  alert_date: TIMESTAMP,
  days_since_last_delivery: INT,
  alert_status: ENUM('pending', 'reviewed', 'resolved'),
  reviewed_by: UUID (FK → users),
  reviewed_at: TIMESTAMP,
  notes: TEXT
}
```

## Componentes React Principales

```
App.js (Componente raíz)
├── NavBar
│   ├── Links de navegación
│   ├── Información de usuario
│   └── Botón de logout
├── Routes
│   ├── /ingreso → Login
│   ├── /panel → Dashboard
│   ├── /registrar-ayuda → AidRegistration
│   ├── /inventario → InventoryManagement
│   ├── /beneficiarios → BeneficiaryManagement
│   ├── /reportes → Reports
│   ├── /auditorias → AuditTrail
│   ├── /usuarios → UserManagement
│   └── /api/... → Backend APIs
└── Context
    └── AuthContext (Token y usuario)
```

## Flujos de Usuario

### Admin
1. Login
2. Dashboard (ver estadísticas)
3. Crear tipos de ayuda
4. Crear/editar inventario
5. Revisar reportes
6. Gestionar alertas de auditoría
7. Crear usuarios

### Operador
1. Login
2. Dashboard (entregas realizadas)
3. Registrar ayudas
4. Ver/gestionar inventario
5. Generar comprobantes
6. Ver entregas por municipio

### Auditor
1. Login
2. Dashboard (estadísticas)
3. Revisar alertas de duplicidad
4. Consultar bitácora de entregas
5. Ver registro de cambios
6. Generar reportes para entes de control

## Seguridad

### Implementado
- ✅ JWT para autenticación
- ✅ Bcrypt para hashear contraseñas
- ✅ CORS configurado
- ✅ Control de acceso por roles
- ✅ Auditoría de cambios
- ✅ Hash de verificación en comprobantes

### Recomendaciones Futuras
- [ ] HTTPS obligatorio
- [ ] Autenticación 2FA
- [ ] Rate limiting
- [ ] Encriptación de datos sensibles
- [ ] Backup automático
- [ ] Logs centralizados

## Rendimiento

### Optimizaciones Implementadas
- Índices en tablas principales
- Vistas SQL para reportes
- Paginación en listados
- Caché en JWT
- Pool de conexiones a BD

### Escalabilidad
- Arquitectura separada (backend/frontend)
- API stateless
- Base de datos normalizada
- Fácil para agregar réplicas

## Mantenimiento

### Logs
- Backend: Console logs + archivos
- Frontend: Console logs + local storage
- Base de datos: Auditoría completa

### Monitoreo
- Status endpoint: GET /health
- Error handling global
- Alertas de duplicidad automáticas

### Backups
```bash
# Diario
pg_dump -U user -d ayudas_humanitarias > backup_$(date +%Y%m%d).sql

# Semanal
tar -czf backup_$(date +%Y%m%d).tar.gz /path/to/app
```

---

Versión: 1.0.0
Fecha: 17 de febrero de 2026
