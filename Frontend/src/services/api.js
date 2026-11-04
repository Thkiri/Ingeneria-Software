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

// ========================================================
// Mecánicos / Usuarios
// ========================================================

export async function getMecanicos() {
  const data = await apiRequest('/mecanicos/');
  return data.results ? data.results : data;
}

