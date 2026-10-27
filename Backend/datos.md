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

## 🚀 Guía de Uso Rápido

### Método Recomendado (Un solo clic)
En la raíz del proyecto, simplemente haz doble clic en:
* **`iniciar aplicacion.bat`**  
*(Activa automáticamente el entorno virtual, levanta el servidor y abre el navegador en el panel administrativo).*

---

### Método Manual por Consola (PowerShell)
Si prefieres iniciar manualmente desde la terminal:

```powershell
# 1. Desde la raíz, activar entorno virtual
.\.venv\Scripts\Activate.ps1

# 2. Entrar a la carpeta Backend
cd Backend

# 3. Aplicar migraciones pendientes (si las hay)
python manage.py migrate

# 4. Iniciar servidor local
python manage.py runserver
```
Servidor disponible en: `http://127.0.0.1:8000/` *(redirige automáticamente al panel admin)*.

> **Nota sobre datos de prueba:** La base de datos `db.sqlite3` ya viene precargada con clientes, vehículos y órdenes de prueba para el Sprint 1. No se requiere ningún script adicional para poblar datos.

---

## 📖 Guía Operativa de Uso del Sistema (Flujo del Taller)

### Paso 1: Recepción del Cliente
1. Ir a **Clientes** > **Añadir Cliente**.
2. Ingresar RUT (ej: `12.345.678-9`), Nombre, Apellido y Teléfono de contacto.
3. *Nota:* También puedes crearlo directamente desde el formulario de vehículos usando el botón verde **`+`** junto al campo *Cliente*.

### Paso 2: Registro del Vehículo
1. Ir a **Vehículos** > **Añadir Vehículo**.
2. Ingresar la Patente (ej: `BBCC12`), Marca, Modelo, Año y Kilometraje actual.
3. En el campo **Cliente**, buscar y seleccionar al propietario.

### Paso 3: Apertura de la Orden de Trabajo (OT)
1. Ir a **Órdenes de Trabajo** > **Añadir Orden de Trabajo**.
2. Seleccionar el **Cliente** y su **Vehículo** correspondiente *(el sistema bloquea si se intenta asignar un auto ajeno)*.
3. El estado inicial se fija por defecto en **`Ingresada (Pendiente de Revisión)`**.
4. La **Fecha estimada de entrega** se deja vacía al inicio (se programará una vez evaluado el auto).
5. Asignar opcionalmente el mecánico técnico en **Mecánico asignado**.
6. Guardar. El sistema generará el correlativo oficial (ej: `OT-0009`) y registrará al creador automáticamente.

### Paso 4: Diagnóstico y Registro de Trabajos
1. Al comenzar la revisión, cambiar el estado a **`En Diagnóstico`**.
2. En la ficha de la orden, desplegar la sección **Información Técnica** para registrar:
   * Diagnóstico inicial del problema.
   * Repuestos requeridos / insumos.
   * Trabajos realizados y observaciones.
3. Programar la **Fecha estimada de entrega**.

### Paso 5: Ciclo de Reparación y Entrega
* **Cambio rápido de estado:** Desde la tabla principal de OTs, cambiar el desplegable en la columna *Estado* (`En Reparación` -> `Control de Calidad` -> `Lista para Entregar` -> `Entregada`) y pulsar *Guardar*.
* **Auditoría:** Al fondo de cada orden se registra automáticamente la fecha, hora y usuario responsable de cada cambio de estado.

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
  1. `ING` — Ingresada (Pendiente de Revisión)
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

## 📐 Decisiones de Diseño y Alcance (Sprint 1)

1. **Validación de Coherencia Cliente—Vehículo (`OrdenTrabajo.clean`)**:
   - **Implementación actual:** Se valida a nivel de modelo que el vehículo seleccionado pertenezca obligatoriamente al cliente asignado a la orden, evitando cruces inconsistentes de datos en el panel de administración.
   - ⚠️ **Recordatorio para futuros sprints:** Cuando se desarrolle un frontend o formulario interactivo avanzado, el cliente debería auto-asignarse o filtrarse dinámicamente al seleccionar el vehículo para evitar doble selección manual.

2. **Redirección de la raíz `/` a `/admin/`**:
   - **Implementación actual:** Dado que el Sprint 1 se enfoca 100% en el CRUD operativo del panel de administración y no cuenta con vistas públicas, la ruta raíz `http://127.0.0.1:8000/` redirige temporalmente (HTTP 302) al `/admin/`.
   - ⚠️ **Recordatorio para futuros sprints:** Retirar o cambiar esta redirección en `tecnimotor/urls.py` una vez que se implemente la vista pública para clientes (consulta de OTs por RUT o patente).

3. **Mecánicos y Gestión de Accesos**:
   - **Alcance Sprint 1:** La operación se realiza centralizadamente desde la cuenta `admin`. Los usuarios `mecanico1` y `mecanico2` existen en la base de datos como técnicos asignables en el campo `mecanico_asignado` de las OTs.
   - ⚠️ **Recordatorio para futuros sprints:** Asignar `is_staff = True` y crear un grupo de permisos exclusivo para mecánicos cuando se aborde el sprint de roles y accesos independientes.

4. **Base de Datos y Pruebas Manuales**:
   - **Alcance Sprint 1:** Se mantiene la base de datos `db.sqlite3` en el repositorio con datos de prueba mínimos (clientes, autos y OTs) para facilitar el testeo manual visual e interactivo de todo el flujo de trabajo sin requerir fixtures adicionales.
   - ⚠️ **Recordatorio para futuros sprints:** Desversionar `db.sqlite3` en `.gitignore` antes de pasar a fases de pre-producción o producción.

---

## 🔮 Roadmap / Próximas Fases Sugeridas

1. **Vistas Públicas para Clientes:** Consulta en línea del estado de su vehículo ingresando únicamente su RUT o patente.
2. **Módulo de Presupuestos y Cobros:** Registro de mano de obra y costo de repuestos con cálculo de total y estado de pago.
3. **Notificaciones Automáticas:** Envío de correo o mensaje (WhatsApp/SMS) cuando la orden cambie a *"Lista para Entregar"*.
4. **Módulo de Inventario de Repuestos:** Control de stock físico del pañol de repuestos.