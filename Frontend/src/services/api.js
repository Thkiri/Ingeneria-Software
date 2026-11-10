const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Función auxiliar para realizar peticiones HTTP seguras y parsear errores.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null) {
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            const messages = Object.entries(errorData).map(([field, msgs]) => {
              const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
              if (field === 'non_field_errors' || field === 'detail') return text;
              const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
              return `${fieldLabel}: ${text}`;
            });
            errorMessage = messages.join(' · ');
          }
        } else {
          errorMessage = String(errorData);
        }
      } catch {
        // Fallback si la respuesta no es JSON
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
}

// ========================================================
// Órdenes de Trabajo (OT)
// ========================================================

export async function getOrdenes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.estado) params.append('estado', filters.estado);
  if (filters.search) params.append('search', filters.search);
  if (filters.mecanico) params.append('mecanico', filters.mecanico);
  if (filters.cliente) params.append('cliente', filters.cliente);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest(`/ordenes/${query}`);
  // Soporta tanto respuestas paginadas (DRF results) como arrays directos
  return data.results ? data.results : data;
}

export async function getOrden(numero) {
  return await apiRequest(`/ordenes/${numero}/`);
}

export async function createOrden(ordenData) {
  return await apiRequest('/ordenes/', {
    method: 'POST',
    body: JSON.stringify(ordenData),
  });
}

export async function updateOrden(numero, ordenData) {
  return await apiRequest(`/ordenes/${numero}/`, {
    method: 'PATCH',
    body: JSON.stringify(ordenData),
  });
}

export async function cambiarEstadoOrden(numero, nuevoEstado, observacion = '') {
  return await apiRequest(`/ordenes/${numero}/cambiar-estado/`, {
    method: 'POST',
    body: JSON.stringify({
      nuevo_estado: nuevoEstado,
      observacion,
    }),
  });
}

export async function notificarClienteOrden(numero, observacion = '') {
  return await apiRequest(`/ordenes/${numero}/notificar-cliente/`, {
    method: 'POST',
    body: JSON.stringify({ observacion }),
  });
}

// ========================================================
// Clientes
// ========================================================

export async function getClientes(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiRequest(`/clientes/${query}`);
  return data.results ? data.results : data;
}

export async function createCliente(clienteData) {
  return await apiRequest('/clientes/', {
    method: 'POST',
    body: JSON.stringify(clienteData),
  });
}

export async function updateCliente(id, clienteData) {
  return await apiRequest(`/clientes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(clienteData),
  });
}

export async function deleteCliente(id) {
  return await apiRequest(`/clientes/${id}/`, {
    method: 'DELETE',
  });
}

// ========================================================
// Vehículos
// ========================================================

export async function getVehiculos(clienteId = null, search = '') {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente', clienteId);
  if (search) params.append('search', search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest(`/vehiculos/${query}`);
  return data.results ? data.results : data;
}

export async function createVehiculo(vehiculoData) {
  return await apiRequest('/vehiculos/', {
    method: 'POST',
    body: JSON.stringify(vehiculoData),
  });
}

export async function updateVehiculo(id, vehiculoData) {
  return await apiRequest(`/vehiculos/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(vehiculoData),
  });
}

export async function deleteVehiculo(id) {
  return await apiRequest(`/vehiculos/${id}/`, {
    method: 'DELETE',
  });
}

// ========================================================
// Mecánicos / Usuarios
// ========================================================

export async function getMecanicos() {
  const data = await apiRequest('/mecanicos/');
  return data.results ? data.results : data;
}

// ========================================================
// Consulta Pública de Clientes (HU-08 - Sin Fricción)
// ========================================================

export async function consultarOrdenPublica(rut, patente) {
  const params = new URLSearchParams({
    rut: rut.trim(),
    patente: patente.trim(),
  });
  return await apiRequest(`/consulta-publica/?${params.toString()}`);
}

// ========================================================
// Detalle de Repuestos (HU-10)
// ========================================================

export async function getRepuestos(ordenId) {
  const data = await apiRequest(`/repuestos/?orden=${ordenId}`);
  return data.results ? data.results : data;
}

export async function createRepuesto(repuestoData) {
  return await apiRequest('/repuestos/', {
    method: 'POST',
    body: JSON.stringify(repuestoData),
  });
}

export async function deleteRepuesto(id) {
  return await apiRequest(`/repuestos/${id}/`, {
    method: 'DELETE',
  });
}

// ========================================================
// Registro de Horas Hombre (HU-05)
// ========================================================

export async function getHoras(ordenId) {
  const data = await apiRequest(`/horas/?orden=${ordenId}`);
  return data.results ? data.results : data;
}

export async function createHora(horaData) {
  return await apiRequest('/horas/', {
    method: 'POST',
    body: JSON.stringify(horaData),
  });
}

export async function deleteHora(id) {
  return await apiRequest(`/horas/${id}/`, {
    method: 'DELETE',
  });
}

// ========================================================
// Control de Calidad (HU-07)
// ========================================================

export async function createControlCalidad(calidadData) {
  return await apiRequest('/controles-calidad/', {
    method: 'POST',
    body: JSON.stringify(calidadData),
  });
}

export async function updateControlCalidad(id, calidadData) {
  return await apiRequest(`/controles-calidad/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(calidadData),
  });
}


