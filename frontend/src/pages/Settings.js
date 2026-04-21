import React, { useState, useContext, useEffect } from 'react';
import API_URL from '../utils/apiConfig';
import { AuthContext } from '../App';
import './Settings.css';

function Settings() {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('perfil');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: ''
  });
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNueva: '',
    passwordConfirmar: ''
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailAyudas: true,
    emailReportes: true,
    emailAuditorias: true,
    emailSistema: true
  });
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
    loadNotificationPreferences();
    loadSessions();
    loadStats();
  }, [user, token]);

  // Cargar preferencias de notificaciones
  const loadNotificationPreferences = async () => {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        setNotificationPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Cargar sesiones
  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/perfil/sesiones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/perfil/estadisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    const updated = { ...notificationPreferences, [name]: checked };
    setNotificationPreferences(updated);
    localStorage.setItem('notificationPreferences', JSON.stringify(updated));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/perfil/actualizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...userData, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage({ 
          type: 'success', 
          text: 'Perfil actualizado correctamente' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: data.mensaje || 'Error al actualizar el perfil' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error de conexión. Intente nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.passwordNueva !== passwordData.passwordConfirmar) {
      setMessage({ 
        type: 'error', 
        text: 'Las contraseñas no coinciden' 
      });
      return;
    }

    if (passwordData.passwordNueva.length < 6) {
      setMessage({ 
        type: 'error', 
        text: 'La contraseña debe tener al menos 6 caracteres' 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/perfil/cambiar-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passwordActual: passwordData.passwordActual,
          passwordNueva: passwordData.passwordNueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Contraseña cambiada correctamente' 
        });
        setPasswordData({
          passwordActual: '',
          passwordNueva: '',
          passwordConfirmar: ''
        });
        setShowPasswordForm(false);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.mensaje || 'Error al cambiar la contraseña' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error de conexión. Intente nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm('¿Estás seguro de que deseas solicitar la eliminación de tu cuenta? Esta acción es irreversible.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/perfil/solicitar-eliminacion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Solicitud de eliminación enviada. Un administrador revisará tu solicitud.' 
        });
        setShowDeleteConfirm(false);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Error al procesar la solicitud' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error de conexión' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Configuración</h1>
        <p>Gestiona tu cuenta y preferencias</p>
      </div>

      {message.text && (
        <div className={`settings-message settings-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-main">
        {/* Sidebar izquierdo con pestañas */}
        <aside className="settings-sidebar">
          <nav className="settings-tabs-nav">
            <button 
              className={`settings-tab ${activeTab === 'perfil' ? 'active' : ''}`}
              onClick={() => setActiveTab('perfil')}
            >
              👤 Perfil
            </button>
            <button 
              className={`settings-tab ${activeTab === 'seguridad' ? 'active' : ''}`}
              onClick={() => setActiveTab('seguridad')}
            >
              🔐 Seguridad
            </button>
            <button 
              className={`settings-tab ${activeTab === 'notificaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('notificaciones')}
            >
              🔔 Notificaciones
            </button>
            <button 
              className={`settings-tab ${activeTab === 'dispositivos' ? 'active' : ''}`}
              onClick={() => setActiveTab('dispositivos')}
            >
              📱 Dispositivos
            </button>
            <button 
              className={`settings-tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
              onClick={() => setActiveTab('estadisticas')}
            >
              📊 Estadísticas
            </button>
            <button 
              className={`settings-tab settings-tab-danger ${activeTab === 'peligro' ? 'active' : ''}`}
              onClick={() => setActiveTab('peligro')}
            >
              ⚠️ Zona de Peligro
            </button>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="settings-content">
          {/* Pestaña: Perfil */}
          {activeTab === 'perfil' && (
            <div className="settings-tab-content">
              <h2>Información de Perfil</h2>
              
              {/* Información del Usuario */}
              <div className="settings-section">
                <h3>Información del Usuario</h3>
                <div className="user-info-grid">
                  <div className="info-item">
                    <label>Correo Electrónico</label>
                    <p className="info-value">{user?.email || 'N/A'}</p>
                    <p className="info-note">No puede ser modificado</p>
                  </div>
                  <div className="info-item">
                    <label>Rol</label>
                    <p className="info-value">{user?.rol || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>ID Usuario</label>
                    <p className="info-value">{user?.id || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Fecha de Registro</label>
                    <p className="info-value">
                      {user?.fechaRegistro 
                        ? new Date(user.fechaRegistro).toLocaleDateString('es-ES') 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actualizar Información Personal */}
              <div className="settings-section">
                <h3>Actualizar Información Personal</h3>
                <form onSubmit={handleUpdateProfile} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre Completo</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Ingrese su nombre completo"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Ingrese su número de teléfono"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="direccion">Dirección</label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      placeholder="Ingrese su dirección"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="settings-btn settings-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Pestaña: Seguridad */}
          {activeTab === 'seguridad' && (
            <div className="settings-tab-content">
              <h2>Seguridad</h2>
              
              <div className="settings-section">
                <h3>Cambiar Contraseña</h3>
                {!showPasswordForm && (
                  <button 
                    className="settings-btn settings-btn-secondary"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    🔐 Cambiar Contraseña
                  </button>
                )}

                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="settings-form">
                    <div className="form-group">
                      <label htmlFor="passwordActual">Contraseña Actual</label>
                      <input
                        type="password"
                        id="passwordActual"
                        name="passwordActual"
                        value={passwordData.passwordActual}
                        onChange={handlePasswordChange}
                        placeholder="Ingrese su contraseña actual"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="passwordNueva">Nueva Contraseña</label>
                      <input
                        type="password"
                        id="passwordNueva"
                        name="passwordNueva"
                        value={passwordData.passwordNueva}
                        onChange={handlePasswordChange}
                        placeholder="Ingrese su nueva contraseña"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="passwordConfirmar">Confirmar Contraseña</label>
                      <input
                        type="password"
                        id="passwordConfirmar"
                        name="passwordConfirmar"
                        value={passwordData.passwordConfirmar}
                        onChange={handlePasswordChange}
                        placeholder="Confirme su nueva contraseña"
                        required
                      />
                    </div>

                    <div className="settings-button-group">
                      <button 
                        type="submit" 
                        className="settings-btn settings-btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Cambiando...' : '🔐 Cambiar Contraseña'}
                      </button>
                      <button 
                        type="button" 
                        className="settings-btn settings-btn-cancel"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            passwordActual: '',
                            passwordNueva: '',
                            passwordConfirmar: ''
                          });
                        }}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Pestaña: Notificaciones */}
          {activeTab === 'notificaciones' && (
            <div className="settings-tab-content">
              <h2>Preferencias de Notificaciones</h2>
              
              <div className="settings-section">
                <p className="section-description">Elige qué notificaciones deseas recibir</p>
                <div className="notification-preferences">
                  <div className="notification-item">
                    <label>
                      <input
                        type="checkbox"
                        name="emailAyudas"
                        checked={notificationPreferences.emailAyudas}
                        onChange={handleNotificationChange}
                      />
                      <span>Notificaciones sobre ayudas</span>
                    </label>
                    <p className="notification-desc">Recibe actualizaciones cuando hay cambios en ayudas</p>
                  </div>

                  <div className="notification-item">
                    <label>
                      <input
                        type="checkbox"
                        name="emailReportes"
                        checked={notificationPreferences.emailReportes}
                        onChange={handleNotificationChange}
                      />
                      <span>Notificaciones de reportes</span>
                    </label>
                    <p className="notification-desc">Recibe notificaciones cuando se generan reportes</p>
                  </div>

                  <div className="notification-item">
                    <label>
                      <input
                        type="checkbox"
                        name="emailAuditorias"
                        checked={notificationPreferences.emailAuditorias}
                        onChange={handleNotificationChange}
                      />
                      <span>Notificaciones de auditorías</span>
                    </label>
                    <p className="notification-desc">Recibe notificaciones de cambios auditados</p>
                  </div>

                  <div className="notification-item">
                    <label>
                      <input
                        type="checkbox"
                        name="emailSistema"
                        checked={notificationPreferences.emailSistema}
                        onChange={handleNotificationChange}
                      />
                      <span>Notificaciones del sistema</span>
                    </label>
                    <p className="notification-desc">Recibe notificaciones importantes del sistema</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña: Dispositivos */}
          {activeTab === 'dispositivos' && (
            <div className="settings-tab-content">
              <h2>Dispositivos Conectados</h2>
              
              <div className="settings-section">
                <p className="section-description">Dispositivos desde los que has iniciado sesión</p>
                {sessions.length > 0 ? (
                  <div className="sessions-list">
                    {sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-info">
                          <div className="session-device">
                            {session.dispositivo === 'mobile' ? '📱' : '💻'} {session.dispositivo}
                          </div>
                          <div className="session-location">{session.ubicacion}</div>
                          <div className="session-time">
                            Último acceso: {new Date(session.ultimoAcceso).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        {session.actual && (
                          <span className="session-badge">Actual</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="session-empty">No hay información de sesiones disponible</p>
                )}
              </div>
            </div>
          )}

          {/* Pestaña: Estadísticas */}
          {activeTab === 'estadisticas' && (
            <div className="settings-tab-content">
              <h2>Estadísticas Personales</h2>
              
              {stats && (
                <div className="settings-section">
                  <div className="stats-grid">
                    {user?.rol === 'operador' && (
                      <>
                        <div className="stat-card">
                          <div className="stat-number">{stats.ayudasRegistradas || 0}</div>
                          <div className="stat-label">Ayudas Registradas</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-number">{stats.beneficiariosRegistrados || 0}</div>
                          <div className="stat-label">Beneficiarios Registrados</div>
                        </div>
                      </>
                    )}
                    {user?.rol === 'auditor' && (
                      <div className="stat-card">
                        <div className="stat-number">{stats.auditoriasRealizadas || 0}</div>
                        <div className="stat-label">Auditorías Realizadas</div>
                      </div>
                    )}
                    {user?.rol === 'administrador' && (
                      <>
                        <div className="stat-card">
                          <div className="stat-number">{stats.usuariosCreados || 0}</div>
                          <div className="stat-label">Usuarios Creados</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-number">{stats.ayudasTotales || 0}</div>
                          <div className="stat-label">Ayudas en Sistema</div>
                        </div>
                      </>
                    )}
                    <div className="stat-card">
                      <div className="stat-number">{stats.diasActivo || 0}</div>
                      <div className="stat-label">Días Activo</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña: Zona de Peligro */}
          {activeTab === 'peligro' && (
            <div className="settings-tab-content">
              <h2>Zona de Peligro</h2>
              
              <div className="settings-section settings-danger-section">
                <h3>Solicitar Eliminación de Cuenta</h3>
                <p className="danger-description">Acciones irreversibles. Procede con cuidado.</p>
                
                {!showDeleteConfirm ? (
                  <button 
                    className="settings-btn settings-btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑️ Solicitar Eliminación de Cuenta
                  </button>
                ) : (
                  <>
                    <div className="danger-warning">
                      <p>⚠️ <strong>Advertencia:</strong> Si solicitas la eliminación de tu cuenta:</p>
                      <ul>
                        <li>Tu cuenta será desactivada inmediatamente</li>
                        <li>Un administrador revisará la solicitud</li>
                        <li>Todos tus datos personales serán eliminados de forma permanente</li>
                        <li>Esta acción no puede ser revertida</li>
                      </ul>
                    </div>
                    <div className="settings-button-group">
                      <button 
                        className="settings-btn settings-btn-danger"
                        onClick={handleRequestDeletion}
                        disabled={loading}
                      >
                        {loading ? 'Procesando...' : '🗑️ Confirmar Eliminación'}
                      </button>
                      <button 
                        className="settings-btn settings-btn-secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer de Información */}
      <div className="settings-info-footer">
        <div className="support-info-footer">
          <div className="support-item-footer">
            <div className="support-title">📧 Soporte Técnico</div>
            <a href="mailto:byjosealbert@gmail.com">✉️ byjosealbert@gmail.com</a>
            <a href="tel:3138291467">📱 +57 313 829 1467</a>
          </div>
          <div className="support-item-footer">
            <div className="support-title">❓ Preguntas Frecuentes</div>
            <ul className="faq-list-footer">
              <li><strong>¿Cómo registro una ayuda?</strong> - Ve a "Registrar Ayuda"</li>
              <li><strong>¿Cómo cambio mi contraseña?</strong> - Usa "Cambiar Contraseña"</li>
              <li><strong>¿Cómo genero reportes?</strong> - Accede a "Reportes"</li>
              <li><strong>¿Ver auditoría?</strong> - Ve a "Auditoría" en el menú</li>
              <li><strong>¿Dónde veo el inventario?</strong> - Ve a "Gestión de Inventario"</li>
              <li><strong>¿Cómo descargo un reporte?</strong> - En "Reportes", click en Descargar</li>
            </ul>
          </div>
          <div className="support-item-footer">
            <div className="support-title">ℹ️ Versión del Sistema</div>
            <p>v1.0.0 - Enero 2026</p>
            <p className="text-muted">Sistema de Control y Trazabilidad de Ayudas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
