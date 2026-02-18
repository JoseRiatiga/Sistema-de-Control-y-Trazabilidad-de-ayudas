# GUÍA RÁPIDA DE INICIO PARA WINDOWS

## Requisitos Previos

1. **Node.js y npm**
   - Descargar desde: https://nodejs.org (versión 14 o superior)
   - Verificar instalación:
   ```
   node --version
   npm --version
   ```

2. **PostgreSQL**
   - Descargar desde: https://www.postgresql.org/download/windows/
   - Instalar con usuario: postgres
   - Contraseña: (la que elijas)
   - Puerto: 5432 (por defecto)

3. **Git** (opcional)
   - Descargar desde: https://git-scm.com/

## Paso 1: Preparar Base de Datos

Abre **pgAdmin** (incluido en PostgreSQL):

1. Haz clic derecho en "Databases"
2. Selecciona "Create" → "Database"
3. Nombre: `ayudas_humanitarias`
4. Click "Save"

Luego abre una consola PostgreSQL:
```sql
-- Conectar a la base de datos
\c ayudas_humanitarias

-- Copiar el contenido de: database/schema.sql
-- Y pegarlo aquí

-- Luego copiar el contenido de: database/seeds.sql
-- Y pegarlo aquí
```

## Paso 2: Configurar Backend

1. Abre una terminal/PowerShell en la carpeta del proyecto

2. Navega a la carpeta backend:
```powershell
cd backend
```

3. Instala dependencias:
```powershell
npm install
```

4. Copia el archivo de ejemplo:
```powershell
Copy-Item .env.example .env
```

5. Edita el archivo `.env`:
```
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ayudas_humanitarias
JWT_SECRET=mi_secreto_super_secreto_aqui
```

6. Inicia el servidor:
```powershell
npm run dev
```

Deberías ver:
```
Servidor iniciado en puerto 5000
```

## Paso 3: Configurar Frontend

1. Abre **OTRA terminal/PowerShell** en la carpeta del proyecto

2. Navega a la carpeta frontend:
```powershell
cd frontend
```

3. Instala dependencias:
```powershell
npm install
```

4. Inicia la aplicación:
```powershell
npm start
```

Debería abrir automáticamente http://localhost:3000

## Paso 4: Crear Usuario de Prueba

En tu navegador, con el frontend abierto:

1. En la pantalla de login, busca un botón para "Registrarse" (o:
2. USA ESTE CURL en PowerShell:

```powershell
$body = @{
    name = "Tu Nombre"
    email = "tu@email.com"
    password = "password123"
    role = "operador"
    municipality = "La Paz"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

## Problemas Comunes

### Error: "Cannot connect to database"
**Solución:**
- Verificar que PostgreSQL está ejecutándose
- Verificar credenciales en `.env`
- Verificar que el puerto 5432 está libre

### Error: "Port 3000 already in use"
**Solución:**
```powershell
# Encontrar proceso en puerto 3000
Get-Process | Where-Object {$_.Handles -like "*3000*"}

# O cambiar puerto en frontend
```

### Error: "npm: command not found"
**Solución:**
- Node.js no está instalado correctamente
- Reiniciar PowerShell después de instalar Node.js

## Acceso a la Aplicación

### Después de registrar un usuario:
1. Abre http://localhost:3000
2. Ingresa tu email y contraseña
3. ¡Listo!

### Rutas Principales:
- Panel Principal: http://localhost:3000/panel
- Registrar Ayuda: http://localhost:3000/registrar-ayuda
- Inventario: http://localhost:3000/inventario
- Beneficiarios: http://localhost:3000/beneficiarios
- Reportes: http://localhost:3000/reportes
- Auditoría: http://localhost:3000/auditorias

## API en Postman (Opcional)

Para probar la API con Postman:

1. Descarga Postman: https://www.postman.com/downloads/

2. Importa este JSON en Postman:

```json
{
  "info": {
    "name": "Sistema de Ayudas API"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"tu@email.com\",\"password\":\"password123\"}"
        }
      }
    }
  ]
}
```

## Estructura del Proyecto

```
Sistema de Control y Trazabilidad de ayudas/
├── backend/          ← Servidor (Puerto 5000)
├── frontend/         ← Interfaz web (Puerto 3000)
├── database/         ← Scripts SQL
├── docs/             ← Documentación completa
└── README.md         ← Información general
```

## Parar los Servicios

Para detener:

1. **Backend:** Presiona `Ctrl+C` en la terminal del backend
2. **Frontend:** Presiona `Ctrl+C` en la terminal del frontend

## Siguiente: Usar el Sistema

Después de iniciar, puedes:

1. **Registrar beneficiarios** (censo)
2. **Crear tipos de ayuda** (admin)
3. **Registrar entregas** (operador)
4. **Ver alertas de duplicidad** (auditor)
5. **Generar reportes** (auditor/admin)

## Documentación Completa

Para más detalles, revisa:
- `README.md` - Descripción general
- `docs/INSTALACION.md` - Guía completa
- `docs/API_REFERENCE.md` - Endpoints de API
- `docs/ARQUITECTURA.md` - Diseño del sistema

## Soporte

Si encuentras problemas:
1. Verifica que todos los requisitos estén instalados
2. Lee la documentación en `/docs`
3. Revisa los logs en la terminal
4. Contacta al equipo de soporte

---

**Versión:** 1.0.0  
**Última actualización:** 17 de febrero de 2026

¡Bienvenido al Sistema de Ayudas Humanitarias!
