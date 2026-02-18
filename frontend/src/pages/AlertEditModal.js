import React, { useState } from 'react';
import './AlertEditModal.css';

const AlertEditModal = ({ alert, action, onClose, onConfirm }) => {
  const [razon, setRazon] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');

  const razonesPorAccion = {
    revisada: [
      'Verificación inicial completada',
      'Información recopilada',
      'En proceso de investigación',
      'Pendiente de validación'
    ],
    resuelta: [
      'Error del operador - duplicado por error',
      'Caso válido - beneficiario autorizado',
      'Necesita censado actualizado',
      'Investigación completada',
      'Falsa alerta - datos coincidentes'
    ]
  };

  const razonesDisponibles = razonesPorAccion[action] || [];

  const handleConfirm = () => {
    if (!razon.trim()) {
      setError('Debes seleccionar una razón');
      return;
    }
    
    if (!notas.trim()) {
      setError('Debes agregar notas o comentarios');
      return;
    }

    onConfirm(razon, notas);
  };

  const getActionLabel = () => {
    return action === 'revisada' ? 'Revisar Alerta' : 'Resolver Alerta';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getActionLabel()}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="alert-info">
            <p><strong>Beneficiario:</strong> {alert.primer_nombre} {alert.primer_apellido}</p>
            <p><strong>Cédula:</strong> {alert.cedula}</p>
            <p><strong>Tipo de Ayuda:</strong> {alert.aid_type_name}</p>
            <p><strong>Días desde última entrega:</strong> {alert.dias_desde_ultima_entrega} días</p>
          </div>

          <div className="form-group">
            <label htmlFor="razon">Selecciona una razón *</label>
            <select
              id="razon"
              value={razon}
              onChange={(e) => {
                setRazon(e.target.value);
                setError('');
              }}
              className={error && !razon ? 'input-error' : ''}
            >
              <option value="">-- Selecciona una razón --</option>
              {razonesDisponibles.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notas">Notas o Comentarios *</label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value);
                setError('');
              }}
              placeholder="Agrega detalles adicionales sobre esta acción..."
              rows="4"
              className={error && !notas ? 'input-error' : ''}
            />
          </div>

          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirmar {getActionLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertEditModal;
