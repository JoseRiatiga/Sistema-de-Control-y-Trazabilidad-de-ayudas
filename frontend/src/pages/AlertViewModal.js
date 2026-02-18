import React from 'react';
import './AlertEditModal.css'; // Reutilizamos los estilos del modal de edición

const AlertViewModal = ({ alert, onClose }) => {
  if (!alert) return null;

  const getStatusLabel = () => {
    if (alert.estado_alerta === 'revisada') return '👁️ Revisada';
    if (alert.estado_alerta === 'resuelta') return '✅ Resuelta';
    return alert.estado_alerta;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detalles de Alerta - {getStatusLabel()}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="alert-info">
            <p><strong>Beneficiario:</strong> {alert.primer_nombre} {alert.primer_apellido}</p>
            <p><strong>Cédula:</strong> {alert.cedula || 'N/A'}</p>
            <p><strong>Tipo de Ayuda:</strong> {alert.aid_type_name}</p>
            <p><strong>Días desde última entrega:</strong> {alert.dias_desde_ultima_entrega || 0} días</p>
            <hr />
            <p><strong>Estado:</strong> {getStatusLabel()}</p>
            {alert.revisada_en && (
              <p><strong>Procesado el:</strong> {formatDate(alert.revisada_en)}</p>
            )}
            {alert.revisada_por_nombre && (
              <p><strong>Por:</strong> {alert.revisada_por_nombre}</p>
            )}
          </div>

          {alert.razon_resolucion && (
            <div className="form-group">
              <label><strong>Razón</strong></label>
              <div className="view-box">
                {alert.razon_resolucion}
              </div>
            </div>
          )}

          {alert.notas && (
            <div className="form-group">
              <label><strong>Notas o Comentarios</strong></label>
              <div className="view-box">
                {alert.notas}
              </div>
            </div>
          )}

          {!alert.razon_resolucion && !alert.notas && (
            <p className="text-muted">No hay notas registradas para esta alerta.</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertViewModal;
