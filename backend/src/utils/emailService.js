/**
 * Utilidad para enviar emails con SendGrid
 * 
 * Requiere: SENDGRID_API_KEY en variables de entorno
 */

const sgMail = require('@sendgrid/mail');

// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Enviar email de verificación de cuenta
 * @param {string} email - Email del usuario
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {string} token - Token de verificación
 * @param {string} verificationUrl - URL completa de verificación
 */
const sendVerificationEmail = async (email, nombreUsuario, token, verificationUrl) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  SENDGRID_API_KEY no configurado. Email no enviado.');
      return {
        success: false,
        message: 'SendGrid no configurado'
      };
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@sistemayudas.com',
      subject: 'Verifica tu email - Sistema de Control y Trazabilidad de Ayudas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
            <h1>Sistema de Control y Trazabilidad de Ayudas</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f5f5f5;">
            <h2>Bienvenido, ${nombreUsuario}!</h2>
            
            <p>Para completar tu registro, necesitas verificar tu dirección de email.</p>
            
            <p style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #27ae60; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        font-weight: bold;">
                Verificar Email
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px;">
              O copia y pega este link en tu navegador:<br>
              <code style="background-color: white; padding: 10px; display: block; 
                          margin-top: 10px; word-break: break-all;">
                ${verificationUrl}
              </code>
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Este link expira en 24 horas.<br>
              Si no creaste esta cuenta, puedes ignorar este email.
            </p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 15px; text-align: center; 
                      font-size: 12px; color: #666;">
            <p>Sistema de Control y Trazabilidad de Ayudas 2026</p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    
    console.log(`✅ Email de verificación enviado a: ${email}`);
    return {
      success: true,
      message: 'Email enviado correctamente'
    };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Enviar email de cambio de contraseña
 */
const sendPasswordResetEmail = async (email, nombreUsuario, resetUrl) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  SENDGRID_API_KEY no configurado.');
      return { success: false };
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@sistemayudas.com',
      subject: 'Recuperar Contraseña - Sistema de Ayudas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
            <h1>Recuperar Contraseña</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f5f5f5;">
            <p>Hola ${nombreUsuario},</p>
            
            <p>Recibimos una solicitud para recuperar tu contraseña.</p>
            
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #e74c3c; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        font-weight: bold;">
                Recuperar Contraseña
              </a>
            </p>
            
            <p style="color: #666; font-size: 12px;">
              Este link expira en 1 hora.
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Email de recuperación enviado a: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
