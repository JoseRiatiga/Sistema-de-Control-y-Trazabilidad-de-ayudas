# API REST Endpoints - Sistema de Ayudas Humanitarias

## Base URL
```
http://localhost:5000/api
```

## Headers Requeridos
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 1. AUTENTICACIÓN

### Registrar Usuario
```
POST /auth/register
Content-Type: application/json

{
  "name": "Juan Operador",
  "email": "operador@example.com",
  "password": "password123",
  "role": "operador|admin|auditor",
  "phone": "555-1234",
  "municipality": "La Paz"
}

Respuesta 201:
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "uuid",
    "name": "Juan Operador",
    "email": "operador@example.com",
    "role": "operador",
    "municipality": "La Paz"
  }
}
```

### Iniciar Sesión
```
POST /auth/login
Content-Type: application/json

{
  "email": "operador@example.com",
  "password": "password123"
}

Respuesta 200:
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Juan Operador",
    "email": "operador@example.com",
    "role": "operador",
    "municipality": "La Paz"
  }
}
```

### Obtener Perfil
```
GET /auth/profile
Authorization: Bearer <TOKEN>

Respuesta 200:
{
  "id": "uuid",
  "name": "Juan Operador",
  "email": "operador@example.com",
  "role": "operador",
  "phone": "555-1234",
  "municipality": "La Paz"
}
```

---

## 2. CENSO (BENEFICIARIOS)

### Crear Beneficiario
```
POST /censo
Authorization: Bearer <TOKEN>

{
  "identification": "12345678",
  "first_name": "Maria",
  "last_name": "González",
  "phone": "555-0001",
  "email": "maria@example.com",
  "address": "Calle Principal, Casa 10",
  "municipality": "La Paz",
  "latitude": -16.5000,
  "longitude": -68.1500,
  "family_members": 4
}

Respuesta 201:
{
  "message": "Beneficiario registrado",
  "censado": { ... }
}
```

### Listar Beneficiarios
```
GET /censo?limit=100&offset=0
Authorization: Bearer <TOKEN>

Respuesta 200: Array de beneficiarios
```

### Obtener Beneficiario por ID
```
GET /censo/:id
Authorization: Bearer <TOKEN>

Respuesta 200: Datos completos del beneficiario
```

### Buscar por Cédula
```
GET /censo/identification/:identification
Authorization: Bearer <TOKEN>

Respuesta 200: Datos del beneficiario
```

### Beneficiarios por Municipio
```
GET /censo/municipality/:municipality
Authorization: Bearer <TOKEN>

Respuesta 200: Array de beneficiarios en el municipio
```

---

## 3. TIPOS DE AYUDA

### Crear Tipo de Ayuda (Admin)
```
POST /aids/types
Authorization: Bearer <TOKEN>

{
  "name": "Arroz",
  "description": "Arroz por kilogramo",
  "unit": "Kg"
}

Respuesta 201: Tipo de ayuda creado
```

### Listar Tipos de Ayuda
```
GET /aids/types
Authorization: Bearer <TOKEN>

Respuesta 200:
[
  {
    "id": "uuid",
    "name": "Arroz",
    "description": "Arroz por kilogramo",
    "unit": "Kg",
    "created_at": "2026-02-17T10:30:00Z"
  },
  ...
]
```

---

## 4. ENTREGAS DE AYUDA

### Registrar Entrega
```
POST /aids/delivery
Authorization: Bearer <TOKEN>

{
  "censado_id": "uuid-beneficiario",
  "aid_type_id": "uuid-tipo-ayuda",
  "quantity": 10,
  "municipality": "La Paz",
  "notes": "Entrega realizada sin novedad"
}

Respuesta 201:
{
  "message": "Ayuda entregada exitosamente",
  "delivery": {
    "id": "uuid",
    "receipt_number": "REC-timestamp-random",
    "delivery_date": "2026-02-17T10:30:00Z",
    "quantity": 10
  },
  "duplicateAlert": null | {
    "message": "Alerta: Este beneficiario ya recibió esta ayuda recientemente",
    "lastDelivery": "2026-02-10T15:45:00Z",
    "daysSince": 7
  }
}
```

### Listar Entregas
```
GET /aids/delivery?limit=100&offset=0
Authorization: Bearer <TOKEN>

Respuesta 200: Array de entregas
```

### Entregas de Beneficiario
```
GET /aids/delivery/beneficiary/:censado_id
Authorization: Bearer <TOKEN>

Respuesta 200: Array de entregas del beneficiario con detalles
```

### Entregas por Municipio
```
GET /aids/delivery/municipality/:municipality?dateFrom=2026-02-01&dateTo=2026-02-28
Authorization: Bearer <TOKEN>

Respuesta 200: Array de entregas del municipio
```

---

## 5. INVENTARIO

### Crear Inventario (Admin)
```
POST /inventory
Authorization: Bearer <TOKEN>

{
  "aid_type_id": "uuid",
  "quantity": 100,
  "cost_per_unit": 10.50,
  "municipality": "La Paz",
  "warehouse_location": "Almacén Central - Estante A1"
}

Respuesta 201: Inventario creado
```

### Listar Inventario
```
GET /inventory
Authorization: Bearer <TOKEN>

Respuesta 200: Array con todos los items de inventario
```

### Inventario por Municipio
```
GET /inventory/municipality/:municipality
Authorization: Bearer <TOKEN>

Respuesta 200: Items de inventario en el municipio
```

### Actualizar Cantidad (Admin)
```
PATCH /inventory/:id
Authorization: Bearer <TOKEN>

{
  "quantity": 75
}

Respuesta 200: Inventario actualizado
```

---

## 6. AUDITORÍA

### Alertas de Duplicidad
```
GET /audit/duplicate-alerts?municipality=La%20Paz&status=pending
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "id": "uuid",
    "censado_id": "uuid",
    "first_name": "Maria",
    "last_name": "González",
    "identification": "12345678",
    "aid_type_name": "Arroz",
    "last_delivery_date": "2026-02-10T15:45:00Z",
    "days_since_last_delivery": 7,
    "alert_status": "pending|reviewed|resolved",
    "alert_date": "2026-02-17T10:30:00Z"
  }
]
```

### Bitácora de Entregas
```
GET /audit/delivery-log?municipality=La%20Paz&dateFrom=2026-02-01&dateTo=2026-02-28
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200: Array de entregas con detalles del operador
```

### Registro de Cambios
```
GET /audit/change-log?userId=uuid&tableName=aid_deliveries
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "id": "uuid",
    "action": "CREATE|UPDATE|DELETE",
    "table_name": "aid_deliveries",
    "record_id": "uuid",
    "user_id": "uuid",
    "user_name": "Juan Operador",
    "old_values": null,
    "new_values": { ... },
    "timestamp": "2026-02-17T10:30:00Z"
  }
]
```

### Resumen de Auditoría
```
GET /audit/summary?municipality=La%20Paz
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
{
  "pending_alerts": 5,
  "reviewed_alerts": 12,
  "resolved_alerts": 8,
  "total_deliveries": 150,
  "beneficiaries_assisted": 45
}
```

### Actualizar Alerta
```
PATCH /audit/duplicate-alerts/:id
Authorization: Bearer <TOKEN> (Auditor o Admin)

{
  "status": "reviewed|resolved",
  "notes": "Verificado - entrega correcta"
}

Respuesta 200: Alerta actualizada
```

---

## 7. REPORTES

### Reporte de Entregas
```
GET /reports/deliveries?municipality=La%20Paz&dateFrom=2026-02-01&dateTo=2026-02-28
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "municipality": "La Paz",
    "aid_type": "Arroz",
    "total_deliveries": 25,
    "total_quantity": 250,
    "beneficiaries": 20
  }
]
```

### Reporte de Inventario
```
GET /reports/inventory?municipality=La%20Paz
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "municipality": "La Paz",
    "aid_type": "Arroz",
    "quantity": 100,
    "cost_per_unit": 10.50,
    "total_value": 1050.00
  }
]
```

### Reporte de Beneficiarios
```
GET /reports/beneficiaries?municipality=La%20Paz
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "municipality": "La Paz",
    "total_beneficiaries": 100,
    "total_family_members": 350,
    "assisted_beneficiaries": 45
  }
]
```

### Reporte de Alertas
```
GET /reports/duplicate-alerts?municipality=La%20Paz
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
[
  {
    "municipality": "La Paz",
    "total_alerts": 25,
    "pending": 5,
    "reviewed": 12,
    "resolved": 8
  }
]
```

### Reporte para Entes de Control
```
GET /reports/control-entities?municipality=La%20Paz&dateFrom=2026-02-01&dateTo=2026-02-28
Authorization: Bearer <TOKEN> (Auditor o Admin)

Respuesta 200:
{
  "reportId": "uuid",
  "generatedAt": "2026-02-17T10:30:00Z",
  "data": [
    {
      "municipality": "La Paz",
      "total_beneficiaries": 45,
      "total_deliveries": 150,
      "total_items": 250,
      "operator_name": "Juan Operador",
      "alerts_generated": 5,
      "delivery_date": "2026-02-17"
    }
  ]
}
```

---

## 8. COMPROBANTES

### Generar Comprobante
```
POST /receipts/:deliveryId
Authorization: Bearer <TOKEN>

{
  "signedByBeneficiary": true
}

Respuesta 201:
{
  "message": "Comprobante generado exitosamente",
  "receipt": {
    "id": "uuid",
    "receipt_number": "REC-1645064400000-abc123",
    "receipt_hash": "e3b0c44298fc1c149afbf4c8996fb924...",
    "generated_at": "2026-02-17T10:30:00Z",
    "pdf_path": "/path/to/receipt.pdf"
  }
}
```

### Obtener Comprobante
```
GET /receipts/:receiptId
Authorization: Bearer <TOKEN>

Respuesta 200:
{
  "id": "uuid",
  "delivery_id": "uuid",
  "receipt_number": "REC-...",
  "receipt_hash": "...",
  "generated_at": "2026-02-17T10:30:00Z",
  "beneficiary_signature": true,
  "pdf_path": "/path/to/receipt.pdf"
}
```

### Descargar PDF
```
GET /receipts/:receiptId/download
Authorization: Bearer <TOKEN>

Respuesta 200: Descarga de archivo PDF
```

---

## Códigos de Respuesta HTTP

- **200 OK** - Solicitud exitosa
- **201 Created** - Recurso creado
- **400 Bad Request** - Parámetros inválidos
- **401 Unauthorized** - Token requerido o inválido
- **403 Forbidden** - Permisos insuficientes
- **404 Not Found** - Recurso no encontrado
- **500 Internal Server Error** - Error del servidor

---

## Ejemplos con curl

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operador@example.com",
    "password": "password123"
  }'
```

### Registrar Entrega
```bash
curl -X POST http://localhost:5000/api/aids/delivery \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "censado_id": "uuid-beneficiario",
    "aid_type_id": "uuid-tipo",
    "quantity": 10,
    "municipality": "La Paz",
    "notes": "Entrega realizada"
  }'
```

### Obtener Alertas
```bash
curl -X GET "http://localhost:5000/api/audit/duplicate-alerts?status=pending" \
  -H "Authorization: Bearer <TOKEN>"
```

---

Documentación de API v1.0 - Febrero 2026
