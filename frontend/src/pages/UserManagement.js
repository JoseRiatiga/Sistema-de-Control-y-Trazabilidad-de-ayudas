import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './UserManagement.css';

function UserManagement() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    telefono: '',
    municipio: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get('http://localhost:5000/api/auth/users', { headers });
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Error cargando usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre || formData.nombre.trim() === '') {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email válido requerido';
    }
    
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.rol) {
      errors.rol = 'Selecciona un rol';
    }
    
    if (!formData.municipio) {
      errors.municipio = 'Selecciona un municipio';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post('http://localhost:5000/api/auth/create-user', formData, { headers });
      
      setSuccessMessage(`✓ Usuario "${response.data.user.nombre}" creado exitosamente con rol "${response.data.user.rol}"`);
      
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: '',
        telefono: '',
        municipio: ''
      });
      setShowForm(false);
      
      // Recargar lista de usuarios
      fetchUsers();
      
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError('Error al crear usuario: ' + errorMsg);
      console.error(err);
    }
  };

  const getRoleBadgeClass = (rol) => {
    switch(rol) {
      case 'administrador':
        return 'badge badge-admin';
      case 'operador':
        return 'badge badge-operator';
      case 'auditor':
        return 'badge badge-auditor';
      default:
        return 'badge';
    }
  };

  const getRoleLabel = (rol) => {
    switch(rol) {
      case 'administrador':
        return 'Administrador';
      case 'operador':
        return 'Operador';
      case 'auditor':
        return 'Auditor';
      default:
        return rol;
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`⚠️ ADVERTENCIA\n\n¿Está seguro que desea eliminar al usuario?\n\nNombre: ${userName}\n\nEsta acción es irreversible.`)) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const response = await axios.delete(`http://localhost:5000/api/auth/delete-user/${userId}`, { headers });
        
        setSuccessMessage(`✓ Usuario "${response.data.deletedUser.nombre}" eliminado correctamente`);
        fetchUsers();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        setError('Error al eliminar usuario: ' + errorMsg);
        console.error(err);
      }
    }
  };

  return (
    <div className="container user-management">
      <h1>Gestión de Usuarios</h1>

      {/* Validación de permisos */}
      {currentUser?.rol !== 'administrador' && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          ⛔ Solo los administradores pueden acceder a la gestión de usuarios.
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Sección de Permisos por Rol */}
      {currentUser?.rol === 'administrador' && (
        <>
          <div className="card permissions-card">
            <h2>📋 Permisos por Rol</h2>
            <div className="permissions-table-wrapper">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Registrar Ayudas</th>
                    <th>Inventario</th>
                    <th>Reportes</th>
                    <th>Auditoría</th>
                    <th>Gestión de Usuarios</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Administrador</strong></td>
                    <td>✅</td>
                    <td>✅</td>
                    <td>✅</td>
                    <td>✅</td>
                    <td>✅</td>
                  </tr>
                  <tr>
                    <td><strong>Operador</strong></td>
                    <td>✅</td>
                    <td>✅</td>
                    <td>❌</td>
                    <td>❌</td>
                    <td>❌</td>
                  </tr>
                  <tr>
                    <td><strong>Auditor</strong></td>
                    <td>❌</td>
                    <td>❌</td>
                    <td>✅</td>
                    <td>✅</td>
                    <td>❌</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <h2>Usuarios del Sistema</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
                type="button"
              >
                {showForm ? 'Cancelar' : '+ Crear Usuario'}
              </button>
            </div>

            {/* Formulario de creación */}
            {showForm && (
              <div className="user-form">
                <h3>Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreateUser}>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre Completo: *</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFormChange}
                      placeholder="Ej: Juan Pérez"
                    />
                    {formErrors.nombre && <span className="error-message">{formErrors.nombre}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email: *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="Ej: juan@example.com"
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Contraseña: *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="rol">Rol: *</label>
                    <select
                      id="rol"
                      name="rol"
                      value={formData.rol}
                      onChange={handleFormChange}
                    >
                      <option value="">-- Selecciona un rol --</option>
                      <option value="operador">Operador</option>
                      <option value="auditor">Auditor</option>
                      <option value="administrador">Administrador</option>
                    </select>
                    {formErrors.rol && <span className="error-message">{formErrors.rol}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="municipio">Municipio: *</label>
                    <select
                      id="municipio"
                      name="municipio"
                      value={formData.municipio}
                      onChange={handleFormChange}
                    >
                      <option value="">-- Selecciona un municipio --</option>
                      {COLOMBIAN_MUNICIPALITIES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {formErrors.municipio && <span className="error-message">{formErrors.municipio}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono:</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleFormChange}
                      placeholder="Ej: 3015551234"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">Crear Usuario</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <p>Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p>No hay usuarios registrados</p>
            ) : (
              <div className="users-table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Municipio</th>
                      <th>Teléfono</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="user-name">{user.nombre}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={getRoleBadgeClass(user.rol)}>
                            {getRoleLabel(user.rol)}
                          </span>
                        </td>
                        <td>{user.municipio || '-'}</td>
                        <td>{user.telefono || '-'}</td>
                        <td className="date-column">
                          {new Date(user.creado_en).toLocaleDateString('es-CO')}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id, user.nombre)}
                            title={currentUser?.id === user.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                            disabled={currentUser?.id === user.id}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default UserManagement;
