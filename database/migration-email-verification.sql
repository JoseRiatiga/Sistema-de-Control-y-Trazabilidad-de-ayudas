-- Agregar campos para validación de email en tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS (
  email_verificado BOOLEAN DEFAULT false,
  token_verificacion VARCHAR(255),
  fecha_expiracion_token TIMESTAMP
);

-- Índice para búsqueda rápida de tokens
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON usuarios(token_verificacion);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios(email_verificado);
