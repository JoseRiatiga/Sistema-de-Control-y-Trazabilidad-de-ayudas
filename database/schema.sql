-- Script de creación de base de datos para el Sistema de Control y Trazabilidad de Ayudas

-- Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  contraseña_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('administrador', 'operador', 'auditor')),
  telefono VARCHAR(20),
  municipio VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true
);

-- Tabla de Beneficiarios Censados
CREATE TABLE IF NOT EXISTS censados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula VARCHAR(20) UNIQUE NOT NULL,
  primer_nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion VARCHAR(255),
  municipio VARCHAR(100) NOT NULL,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  miembros_familia INT DEFAULT 1,
  registrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tipos de Ayuda
CREATE TABLE IF NOT EXISTS tipos_ayuda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  unidad VARCHAR(50) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Inventario
CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_ayuda_id UUID NOT NULL REFERENCES tipos_ayuda(id),
  cantidad INT NOT NULL DEFAULT 0,
  costo_unitario DECIMAL(10, 2),
  municipio VARCHAR(100) NOT NULL,
  ubicacion_almacen VARCHAR(255),
  recibido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Entregas de Ayuda
CREATE TABLE IF NOT EXISTS entregas_ayuda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  censado_id UUID NOT NULL REFERENCES censados(id),
  tipo_ayuda_id UUID NOT NULL REFERENCES tipos_ayuda(id),
  cantidad INT NOT NULL,
  fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operador_id UUID NOT NULL REFERENCES usuarios(id),
  municipio VARCHAR(100) NOT NULL,
  notas TEXT,
  numero_comprobante VARCHAR(50) UNIQUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Alertas de Duplicidad
CREATE TABLE IF NOT EXISTS alertas_duplicidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  censado_id UUID NOT NULL REFERENCES censados(id),
  tipo_ayuda_id UUID NOT NULL REFERENCES tipos_ayuda(id),
  fecha_ultima_entrega TIMESTAMP,
  fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dias_desde_ultima_entrega INT,
  estado_alerta VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_alerta IN ('pendiente', 'revisada', 'resuelta')),
  revisada_por UUID REFERENCES usuarios(id),
  revisada_en TIMESTAMP,
  notas TEXT
);

-- Tabla de Bitácora de Auditoría
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accion VARCHAR(100) NOT NULL,
  nombre_tabla VARCHAR(100) NOT NULL,
  id_registro UUID,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  valores_antiguos JSONB,
  valores_nuevos JSONB,
  municipio VARCHAR(100),
  direccion_ip VARCHAR(45),
  agente_usuario TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Comprobantes de Entrega
CREATE TABLE IF NOT EXISTS comprobantes_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES entregas_ayuda(id),
  numero_comprobante VARCHAR(50) UNIQUE NOT NULL,
  hash_comprobante VARCHAR(255),
  generado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  firmado_por UUID REFERENCES usuarios(id),
  firma_beneficiario BOOLEAN DEFAULT false,
  ruta_pdf VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Reportes
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  tipo_reporte VARCHAR(50) NOT NULL CHECK (tipo_reporte IN ('entrega', 'inventario', 'auditoria', 'duplicidades', 'municipio')),
  municipio VARCHAR(100),
  fecha_desde DATE,
  fecha_hasta DATE,
  generado_por UUID NOT NULL REFERENCES usuarios(id),
  generado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_ayudas INT,
  total_beneficiarios INT,
  datos JSONB,
  ruta_archivo VARCHAR(255)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_censados_municipio ON censados(municipio);
CREATE INDEX idx_censados_cedula ON censados(cedula);
CREATE INDEX idx_entregas_ayuda_censado_id ON entregas_ayuda(censado_id);
CREATE INDEX idx_entregas_ayuda_fecha_entrega ON entregas_ayuda(fecha_entrega);
CREATE INDEX idx_entregas_ayuda_municipio ON entregas_ayuda(municipio);
CREATE INDEX idx_entregas_ayuda_operador_id ON entregas_ayuda(operador_id);
CREATE INDEX idx_alertas_duplicidad_censado_id ON alertas_duplicidad(censado_id);
CREATE INDEX idx_alertas_duplicidad_estado ON alertas_duplicidad(estado_alerta);
CREATE INDEX idx_bitacora_auditoria_fecha ON bitacora_auditoria(fecha);
CREATE INDEX idx_bitacora_auditoria_usuario_id ON bitacora_auditoria(usuario_id);
CREATE INDEX idx_bitacora_auditoria_municipio ON bitacora_auditoria(municipio);
CREATE INDEX idx_inventario_municipio ON inventario(municipio);
CREATE INDEX idx_inventario_tipo_ayuda_id ON inventario(tipo_ayuda_id);

-- Crear vista para reportes de entregas por municipio
CREATE OR REPLACE VIEW v_entregas_por_municipio AS
SELECT
  ea.municipio,
  ta.nombre AS tipo_ayuda,
  COUNT(*) AS total_entregas,
  SUM(ea.cantidad) AS cantidad_total,
  COUNT(DISTINCT ea.censado_id) AS beneficiarios,
  ea.fecha_entrega::DATE AS fecha_entrega
FROM entregas_ayuda ea
JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
GROUP BY ea.municipio, ta.nombre, ea.fecha_entrega::DATE;

-- Crear vista para alertas de duplicidad
CREATE OR REPLACE VIEW v_resumen_alertas_duplicidad AS
SELECT
  c.municipio,
  COUNT(*) AS total_alertas,
  COUNT(CASE WHEN dad.estado_alerta = 'pendiente' THEN 1 END) AS alertas_pendientes,
  COUNT(CASE WHEN dad.estado_alerta = 'revisada' THEN 1 END) AS alertas_revisadas,
  COUNT(CASE WHEN dad.estado_alerta = 'resuelta' THEN 1 END) AS alertas_resueltas
FROM alertas_duplicidad dad
JOIN censados c ON dad.censado_id = c.id
GROUP BY c.municipio;
