# TecniMotor — Información del Sistema y Uso Actual

> [!WARNING]
> **Recordatorio de seguridad:** Eliminar este documento y eliminar el usuario `admin` al finalizar el proyecto o antes de pasar a producción.

---

## 🔑 Credenciales de Acceso (Entorno de Desarrollo)

### Superusuario (Administrador Principal)
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Panel de administración:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### Usuarios Mecánicos de Prueba
- **Mecánico 1:** `mecanico1` / `mecanico123` (Carlos Reyes)
- **Mecánico 2:** `mecanico2` / `mecanico123` (Pedro Soto)

---

## 🚀 Guía de Uso Rápido (Comandos)

### 1. Activar el entorno virtual (PowerShell)
```powershell
.\.venv\Scripts\Activate.ps1
```
*(Si PowerShell restringe scripts: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

### 2. Instalar dependencias (para nuevos entornos)
```powershell
pip install -r requirements.txt
```

### 3. Aplicar migraciones
```powershell
python manage.py migrate
```

### 4. Cargar datos de prueba iniciales (clientes, autos y OTs)
```powershell
python poblar_datos.py
```

### 5. Iniciar servidor local
```powershell
python manage.py runserver
```
Servidor disponible en: `http://127.0.0.1:8000/`

---

## 🎯 Alcance Actual del Sistema (Fase Actual)

El sistema **TecniMotor** es una plataforma web para la gestión integral de operaciones en un taller mecánico automotriz, permitiendo registrar clientes, sus vehículos y dar seguimiento detallado al ciclo de vida de cada servicio mediante Órdenes de Trabajo (OT).

### 1. Módulo de Clientes (`taller.models.Cliente`)
- Identificación única por RUT chileno (`unique=True`).
- Datos de contacto: Nombre, Apellido, Teléfono de contacto y Correo electrónico.
- Relación de 1 a N con Vehículos y Órdenes de Trabajo.

### 2. Módulo de Vehículos (`taller.models.Vehiculo`)
- Identificación única por Patente (`unique=True`).
- Ficha técnica básica: Marca, Modelo, Año y Kilometraje actual.
- Vinculación obligatoria con un Cliente propietario.
- Búsqueda interactiva y autocompletado en el panel administrativo.

### 3. Módulo de Órdenes de Trabajo (`taller.models.OrdenTrabajo`)
- **Numeración automática:** Correlativo único (`OT-0001`, `OT-0002`, etc.).
- **Fechas:** Fecha de ingreso automática y fecha estimada de entrega programable.
- **Flujo de Estados:**
  1. `ING` — Ingresada
  2. `DIA` — En Diagnóstico
  3. `ESP` — Espera Repuestos
  4. `REP` — En Reparación
  5. `CAL` — Control de Calidad
  6. `LST` — Lista para Entregar
  7. `ENT` — Entregada
  8. `CAN` — Cancelada
- **Edición en línea:** Cambio de estado rápido directamente desde la tabla de listado en el Admin.
- **Asignación y Trazabilidad:**
  - `creado_por`: Usuario que registró la OT en el sistema (asignado automáticamente).
  - `mecanico_asignado`: Técnico asignado para ejecutar las reparaciones.
- **Detalle Técnico (Sección desplegable):**
  - Diagnóstico inicial del problema.
  - Trabajos realizados detallados.
  - Repuestos requeridos / insumos.
  - Observaciones y recomendaciones para el cliente.

---

## 🔮 Roadmap / Próximas Fases Sugeridas

1. **Vistas Públicas para Clientes:** Consulta en línea del estado de su vehículo ingresando únicamente su RUT o patente.
2. **Módulo de Presupuestos y Cobros:** Registro de mano de obra y costo de repuestos con cálculo de total y estado de pago.
3. **Notificaciones Automáticas:** Envío de correo o mensaje (WhatsApp/SMS) cuando la orden cambie a *"Lista para Entregar"*.
4. **Módulo de Inventario de Repuestos:** Control de stock físico del pañol de repuestos.