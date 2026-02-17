# INICIO RÁPIDO EN 5 MINUTOS

## Paso 1: Base de Datos (1 min)

```bash
# Crear base de datos
createdb ayudas_humanitarias

# Crear estructura
psql -U postgres -d ayudas_humanitarias -f database/schema.sql

# Cargar datos de ejemplo
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql
```

## Paso 2: Backend (2 min)

```bash
# Ir a carpeta
cd backend

# Instalar
npm install

# Copiar config
cp .env.example .env

# Editar .env con tus datos de PostgreSQL

# Iniciar
npm run dev
```

**El servidor estará en:** http://localhost:5000

## Paso 3: Frontend (2 min)

**En OTRA terminal:**

```bash
# Ir a carpeta
cd frontend

# Instalar
npm install

# Iniciar
npm start
```

**La aplicación abrirá:** http://localhost:3000

## Paso 4: Crear Usuario

En PowerShell/Terminal:

```powershell
$body = @{
    name = "Mi Usuario"
    email = "usuario@test.com"
    password = "password123"
    role = "operador"
    municipality = "La Paz"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
  -Method Post `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

O en Bash:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Mi Usuario",
    "email":"usuario@test.com",
    "password":"password123",
    "role":"operador",
    "municipality":"La Paz"
  }'
```

## Usar el Sistema

1. Abre http://localhost:3000
2. Ingresa tus credenciales
3. ¡Listo!

## Documentación

- **README.md** - Descripción general
- **docs/INSTALACION.md** - Guía detallada
- **docs/API_REFERENCE.md** - API completa
- **GUIA_WINDOWS.md** - Para Windows específicamente

## Ayuda Rápida

| Problema | Solución |
|----------|----------|
| BD no se conecta | Verificar PostgreSQL está corriendo, credenciales en .env |
| Puerto 3000 ocupado | Cambiar en terminal: PORT=3001 npm start |
| npm no encontrado | Reiniciar terminal después de instalar Node.js |
| Error de CORS | Verificar CORS_ORIGIN en .env del backend |

---

¡Tu sistema está listo! 🎉
