#!/bin/bash

# INICIO RÁPIDO - Sistema de Ayudas Humanitarias
# Este script ayuda a iniciar rápidamente el sistema

echo "====================================="
echo "Sistema de Ayudas Humanitarias"
echo "Inicio Rápido"
echo "====================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado"
    echo "Descárgalo desde: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js encontrado: $(node --version)"
echo ""

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL no está instalado"
    echo "Descárgalo desde: https://www.postgresql.org"
    exit 1
fi

echo "✓ PostgreSQL encontrado"
echo ""

# Crear base de datos
echo "Creando base de datos..."
createdb ayudas_humanitarias 2>/dev/null || echo "Base de datos ya existe"

# Crear estructura
echo "Creando tablas..."
psql -U postgres -d ayudas_humanitarias -f database/schema.sql > /dev/null 2>&1

# Cargar datos de ejemplo
echo "Cargando datos de ejemplo..."
psql -U postgres -d ayudas_humanitarias -f database/seeds.sql > /dev/null 2>&1

echo "✓ Base de datos lista"
echo ""

# Instalar dependencias del backend
echo "Instalando dependencias del backend..."
cd backend
npm install > /dev/null 2>&1

# Crear archivo .env
if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    cp .env.example .env
    echo "⚠ Edita backend/.env con tus credenciales de PostgreSQL"
fi

cd ..
echo "✓ Backend listo"
echo ""

# Instalar dependencias del frontend
echo "Instalando dependencias del frontend..."
cd frontend
npm install > /dev/null 2>&1
cd ..
echo "✓ Frontend listo"
echo ""

echo "====================================="
echo "¡INSTALACIÓN COMPLETADA!"
echo "====================================="
echo ""
echo "Para iniciar el sistema:"
echo ""
echo "TERMINAL 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo "  El servidor estará en http://localhost:5000"
echo ""
echo "TERMINAL 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo "  La app abrirá en http://localhost:3000"
echo ""
echo "Usuarios de prueba:"
echo "  Admin:     admin@ayudas.com"
echo "  Operador:  operador.lapaz@ayudas.com"
echo "  Auditor:   auditor@ayudas.com"
echo ""
echo "Nota: Las contraseñas están hasheadas. Para crear"
echo "usuarios nuevos, usa el endpoint POST /api/auth/register"
echo ""
