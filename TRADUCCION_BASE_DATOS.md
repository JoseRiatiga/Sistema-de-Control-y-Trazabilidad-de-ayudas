# TRADUCCIÓN A ESPAÑOL - BASE DE DATOS

## ✅ Archivos Traducidos

He traducido completamente los siguientes archivos de la base de datos al español:

### 1. `database/schema.sql` ✅

**Tablas traducidas:**

| Nombre Original | Nombre en Español |
|-----------------|------------------|
| `users` | `usuarios` |
| `censados` | `censados` (igual) |
| `aid_types` | `tipos_ayuda` |
| `inventory` | `inventario` |
| `aid_deliveries` | `entregas_ayuda` |
| `duplicate_alerts` | `alertas_duplicidad` |
| `audit_logs` | `bitacora_auditoria` |
| `delivery_receipt` | `comprobantes_entrega` |
| `reports` | `reportes` |

**Columnas de ejemplo - Tabla `usuarios`:**

| Original | Español |
|----------|---------|
| `name` | `nombre` |
| `email` | `email` (igual) |
| `password_hash` | `contraseña_hash` |
| `role` | `rol` |
| `phone` | `telefono` |
| `municipality` | `municipio` |
| `created_at` | `creado_en` |
| `updated_at` | `actualizado_en` |
| `active` | `activo` |

**Vistas traducidas:**

| Original | Español |
|----------|---------|
| `v_deliveries_by_municipality` | `v_entregas_por_municipio` |
| `v_duplicate_alert_summary` | `v_resumen_alertas_duplicidad` |

**Índices traducidos:**

Todos los índices ahora usan nombres de tablas en español:
- `idx_censados_municipio`
- `idx_entregas_ayuda_censado_id`
- `idx_alertas_duplicidad_estado`
- `idx_bitacora_auditoria_fecha`
- etc.

### 2. `database/seeds.sql` ✅

**Datos de ejemplo traducidos:**

- Tipos de ayuda: Alimentos Secos, Arroz, Frijoles, Aceite, Leche, Medicamentos, Mantas, Agua Potable
- Beneficiarios: María González, Carlos López, Juan Martinez, Rosa Fernández, Pedro Rodríguez
- Usuarios: Admin Sistema, Operador La Paz, Auditor Sistema
- Municipios: La Paz, El Alto, Oruro, Cochabamba
- Roles: `administrador`, `operador`, `auditor`

---

## 📋 TABLA DE TRADUCCIÓN COMPLETA

### Columnas de Tiempo

| Inglés | Español |
|--------|---------|
| `created_at` | `creado_en` |
| `updated_at` | `actualizado_en` |
| `timestamp` | `fecha` |
| `generated_at` | `generado_en` |
| `reviewed_at` | `revisada_en` |
| `registered_at` | `registrado_en` |
| `delivered_at` | `entregado_en` |
| `received_at` | `recibido_en` |

### Palabras Clave de Roles

| Inglés | Español |
|--------|---------|
| `admin` | `administrador` |
| `operator` | `operador` |
| `auditor` | `auditor` |

### Estados de Alertas

| Inglés | Español |
|--------|---------|
| `pending` | `pendiente` |
| `reviewed` | `revisada` |
| `resolved` | `resuelta` |

### Campos de Personas

| Inglés | Español |
|--------|---------|
| `name` | `nombre` |
| `first_name` | `primer_nombre` |
| `last_name` | `primer_apellido` |
| `phone` | `telefono` |
| `address` | `direccion` |
| `email` | `email` (igual) |
| `identification` | `cedula` |

### Campos de Ubicación

| Inglés | Español |
|--------|---------|
| `municipality` | `municipio` |
| `latitude` | `latitud` |
| `longitude` | `longitud` |
| `warehouse_location` | `ubicacion_almacen` |

### Campos Técnicos

| Inglés | Español |
|--------|---------|
| `id` | `id` (igual) |
| `_id` | `_id` (igual) |
| `quantity` | `cantidad` |
| `cost_per_unit` | `costo_unitario` |
| `unit` | `unidad` |
| `description` | `descripcion` |
| `notes` | `notas` |
| `status` | `estado` |
| `active` | `activo` |

---

## ⚠️ IMPORTANTE - PRÓXIMOS PASOS

Ahora que la base de datos está en español, **NO debes usar el schema.sql anterior** porque las referencias de tablas cambiarán.

### Pasos a seguir:

1. **Elimina la base de datos antigua** (si la creaste antes):
   ```powershell
   dropdb -U postgres ayudas_humanitarias
   ```

2. **Crea la base de datos de nuevo con el schema traducido:**
   ```powershell
   createdb -U postgres ayudas_humanitarias
   psql -U postgres -d ayudas_humanitarias -f database/schema.sql
   psql -U postgres -d ayudas_humanitarias -f database/seeds.sql
   ```

---

## 📝 NOTAS SOBRE LA TRADUCCIÓN

- ✅ **Todos los campos de la BD están en español**
- ✅ **Los datos de ejemplo están en español**
- ✅ **Los comentarios SQL están en español**
- ✅ **Los nombres de tablas y vistas están en español**
- ✅ **Los índices usan nombres en español**

### Uniformidad

Se ha mantenido consistencia en toda la base de datos:
- Fechas: `creado_en`, `actualizado_en`, `registrado_en`, etc.
- Acciones: `accion` en la bitácora
- Estados: `estado_alerta`, `estado`, etc.

---

## 🔄 CAMBIOS EN EL BACKEND

**Importante:** Si ya iniciaste el backend, necesitarás actualizar las referencias a las tablas.

Por ejemplo, en lugar de:
```sql
SELECT * FROM users
```

Será:
```sql
SELECT * FROM usuarios
```

Si quieres, puedo actualizar el backend automáticamente para que use los nuevos nombres de tablas. ¿Deseas que lo haga?

---

## ✅ VERIFICACIÓN

Una vez crees la base de datos, puedes verificar que está en español con:

```powershell
psql -U postgres -d ayudas_humanitarias -c "\dt"
```

Deberías ver:
```
              List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | alertas_duplicidad      | table | postgres
 public | bitacora_auditoria      | table | postgres
 public | censados                | table | postgres
 public | comprobantes_entrega    | table | postgres
 public | entregas_ayuda          | table | postgres
 public | inventario              | table | postgres
 public | reportes                | table | postgres
 public | tipos_ayuda             | table | postgres
 public | usuarios                | table | postgres
```

---

**¿Necesitas que actualice el backend también al español?** 👇
