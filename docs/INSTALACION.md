# Guía de Instalación y Uso - v1.2.0

**Última actualización:** 21 de abril de 2026

## Instalación Rápida

### 1. Preparar Base de Datos PostgreSQL

```bash
# Crear usuario y base de datos
createuser ayudas_user
createdb -O ayudas_user ayudas_humanitarias

# Crear estructura
psql -U ayudas_user -d ayudas_humanitarias -f database/schema.sql

# Insertar datos de ejemplo (opcional)
psql -U ayudas_user -d ayudas_humanitarias -f database/seeds.sql

# Ejecutar migración para email verification (v1.2.0)
psql -U ayudas_user -d ayudas_humanitarias << 'EOF'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_expiracion_token TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON usuarios(token_verificacion);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios(email_verificado);
EOF
```

### 2. Configurar Backend

```bash
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales:
# DB_USER=ayudas_user
# DB_PASSWORD=tu_contraseña
# DB_NAME=ayudas_humanitarias
# JWT_SECRET=tu_secreto_jwt_aqui
# SENDGRID_API_KEY=tu_clave_sendgrid
# SENDGRID_FROM_EMAIL=noreply@sistemayudas.com

# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# El servidor estará en http://localhost:5000
```

**Configuración SendGrid (v1.2.0):**
1. Crear cuenta en https://sendgrid.com (gratuito con límites)
2. Ir a Settings → API Keys → Create API Key
3. Copiar clave y pegarla en `SENDGRID_API_KEY`
4. Configurar dominio en Sender Authentication (recomendado pero opcional para pruebas)

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar aplicación
npm start

# Se abrirá http://localhost:3000
```

## Características de Seguridad v1.2.0

### Email Verification
- **Flujo:** Registro → Email de verificación → Link de 24h → Activación
- **Sistema:** SendGrid para envío automático de emails
- **Bloqueo:** Login rechazado hasta verificar email
- **Reenvío:** Disponible en Settings → Enviar Verificación

### Password Security
- **Hashing:** bcryptjs con 10 salt rounds
- **Almacenamiento:** Nunca se guarda en texto plano
- **Comparación:** Verificación segura en login y cambio de contraseña

### Enhanced Audit Logging
- **IP Detection:** Extrae IP del cliente (soporta proxies)
- **Device Info:** Detecta navegador, SO, tipo de dispositivo
- **Change Tracking:** Registro antes/después de cambios
- **Full Context:** Usuario, municipio, rol, email, timestamps

## Usuarios de Prueba

Después de ejecutar seeds.sql:

### Admin (con email verificado)
- Email: admin@sistemayudas.com
- Password: admin123 (pre-hasheada en seeds)
- Rol: administrador
- Email verificado: Sí ✓

Para crear más usuarios de prueba:

```bash
# POST /api/auth/register - Sin verificación previa (envía email automático)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Prueba",
    "email": "prueba@test.com",
    "password": "password123",
    "rol": "operador",
    "municipio": "La Paz"
  }'

# Respuesta esperada (201 Created):
{
  "message": "Usuario registrado correctamente. Verifica tu email para activar la cuenta.",
  "user": {
    "id": "uuid...",
    "nombre": "Usuario Prueba",
    "email": "prueba@test.com",
    "rol": "operador",
    "email_verificado": false
  },
  "instrucciones": "Se ha enviado un link de verificación a tu email. Tiene validez de 24 horas."
}

# Usuario debe:
# 1. Revisar email
# 2. Hacer click en link de verificación
# 3. Intentar login (antes fallaba por email_verificado=false)
```

**Reenvío de Verificación:**
```bash
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "prueba@test.com"}'
```

## Flujos de Trabajo

### 1. Crear Usuario Nuevo (Admin)

1. Abrir panel → Gestión de Usuarios
2. Click en "Crear Nuevo Usuario"
3. Llenar formulario con nombre, email, rol, municipio
4. Sistema envía email de verificación automáticamente
5. Nuevo usuario debe verificar email antes de login

### 2. Registrar una Entrega de Ayuda

1. Ir a "Registrar Ayuda"
2. Seleccionar beneficiario de la lista (vinculado con censo)
3. Seleccionar tipo de ayuda
4. Indicar cantidad
5. Especificar municipio
6. Agregar observaciones si es necesario
7. Click en "Registrar Ayuda"
8. Sistema genera comprobante digital automáticamente
9. Cambio registrado en auditoría con IP, navegador, usuario completo

### 3. Generar Comprobante Digital

1. Al registrar una ayuda se genera automáticamente
2. Ir a sección de "Recibos" (en desarrollo)
3. Buscar recibo por número
4. Descargar PDF con firma digital
5. Compartir con beneficiario

### 3. Revisar Alertas de Duplicidad

1. Ir a "Auditoría" → "Alertas de Duplicidad"
2. Filtrar por municipio si es necesario
3. Ver alertas pendientes (en rojo)
4. Click en "Revisar" para investigar
5. Click en "Resolver" cuando se confirma o descarta
6. Agregar notas sobre la decisión

### 4. Generar Reportes

1. Ir a "Reportes"
2. Seleccionar tipo de reporte:
   - Entregas por Municipio
   - Inventario
   - Beneficiarios
   - Alertas de Duplicidad
   - Reporte para Entes de Control
3. Aplicar filtros (fechas, municipio)
4. Click "Generar Reporte"
5. Descargar CSV para análisis

### 5. Revisar Auditoría

1. Ir a "Auditoría"
2. Seleccionar pestaña:
   - Alertas de Duplicidad
   - Bitácora de Entregas
   - Registro de Cambios
3. Ver detalles de cada transacción
4. Filtrar por municipio o usuario

## Funcionalidades Principales

### Dashboard
- Estadísticas rápidas de entregas
- Beneficiarios asistidos
- Alertas pendientes
- Últimas entregas registradas

### Gestión de Beneficiarios
- Vinculación con base de censados
- Búsqueda por cédula
- Historial de entregas
- Datos de ubicación

### Control de Entregas
- Registro digital inmediato
- Comprobantes automáticos
- Detección de duplicidades
- Trazabilidad completa

### Gestión de Inventario
- Seguimiento por municipio
- Cálculo de valores totales
- Ubicación de almacenes
- Historial de movimientos

### Auditoría y Control
- Bitácora de todas las entregas
- Registro de cambios en el sistema
- Alertas configurables
- Reportes para entes de control

## Troubleshooting

### Error: "Cannot connect to database"
- Verificar que PostgreSQL esté ejecutándose
- Verificar credenciales en .env
- Verificar que la base de datos existe

### Error: "Token inválido"
- Iniciar sesión nuevamente
- Limpiar localStorage del navegador
- Verificar JWT_SECRET en .env

### Error: "Role no permitido"
- Verificar que el usuario tenga el rol correcto
- Contactar al administrador para cambiar permisos

### Frontend no se conecta al backend
- Verificar que ambos servidores estén ejecutándose
- Verificar puertos: Backend (5000), Frontend (3000)
- Verificar CORS_ORIGIN en .env del backend

## Mantenimiento

### Backup de Base de Datos
```bash
pg_dump -U ayudas_user ayudas_humanitarias > backup_$(date +%Y%m%d).sql
```

### Restore de Base de Datos
```bash
psql -U ayudas_user ayudas_humanitarias < backup_20260217.sql
```

### Logs del Servidor
Los logs se muestran en la consola del servidor. Para producción, configurar servicio con PM2:

```bash
npm install -g pm2
pm2 start src/server.js --name ayudas-backend
pm2 logs ayudas-backend
```

## Próximos Pasos

- [ ] Configurar HTTPS
- [ ] Implementar autenticación 2FA
- [ ] Agregar módulo de exportación a Excel
- [ ] Integración con sistema de notificaciones
- [ ] Aplicación móvil
- [ ] Dashboard de estadísticas avanzadas

---

Documentación versión 1.0 - 17 de febrero de 2026
