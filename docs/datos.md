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

## 🌐 API RESTful JSON (Sprint 2 - Backend Activo)

La API JSON ha sido habilitada mediante **Django REST Framework** y **django-cors-headers** para ser consumida por el Frontend de React (puerto 5173).

### Endpoints Disponibles

#### 1. Órdenes de Trabajo (`/api/ordenes/`)
* **`GET /api/ordenes/`**: Listado completo paginado con objetos anidados de cliente, vehículo, mecánico asignado e historial de cambios de estado.
  * Filtro por estado: `?estado=ING` (valores válidos: `ING`, `DIA`, `ESP`, `REP`, `CAL`, `LST`, `ENT`, `CAN`).
  * Filtro por cliente: `?cliente=<id>`.
  * Filtro por vehículo: `?vehiculo=<id>`.
  * Filtro por mecánico: `?mecanico=<id>`.
  * Búsqueda general: `?search=<texto>` (busca en número de OT, patente de vehículo, nombre o RUT de cliente).
* **`POST /api/ordenes/`**: Creación de nueva OT. Valida que el vehículo pertenezca obligatoriamente al cliente.
* **`GET /api/ordenes/{numero}/`**: Detalle completo de una orden específica.
* **`PUT / PATCH /api/ordenes/{numero}/`**: Actualización total o parcial de campos técnicos.
* **`POST /api/ordenes/{numero}/cambiar-estado/`**: Transición de estado con auditoría automática.
  * Payload: `{ "nuevo_estado": "REP", "observacion": "Iniciando cambio de frenos" }`.

#### 2. Clientes (`/api/clientes/`)
* **`GET /api/clientes/`**: Listado de clientes.
  * Búsqueda: `?search=<texto>` (por RUT, nombre o apellido).
* **`POST /api/clientes/`**: Creación de nuevo cliente con validación de formato RUT chileno.

#### 3. Vehículos (`/api/vehiculos/`)
* **`GET /api/vehiculos/`**: Listado de vehículos con ficha técnica.
  * Filtro por cliente: `?cliente=<id>` *(permite auto-filtrar vehículos del cliente seleccionado en formularios de React)*.
  * Búsqueda: `?search=<texto>` (por patente, marca o modelo).
* **`POST /api/vehiculos/`**: Creación de nuevo vehículo asociado a un cliente.

#### 4. Mecánicos (`/api/mecanicos/`)
* **`GET /api/mecanicos/`**: Lista de usuarios técnicos activos para poblar el selector de asignación en los formularios.

---

### 💻 Frontend SPA (Sprint 2 - React + Vite Habilitado)

La interfaz gráfica del taller fue desarrollada con **React 19 + Vite** y consume directamente la API REST de Django.

#### Componentes Principales (`Frontend/src/`):
1. **`components/Dashboard.jsx` (Tablero Kanban de 7 Columnas):**
   - Replica con precisión matemática el mockup `Dashboard jefe.png`.
   - 7 columnas ordenadas por estado (`ING`, `DIA`, `ESP`, `REP`, `CAL`, `LST`, `ENT`) con barras de color y contadores automáticos.
   - Tarjetas de OT con número de orden, patente destacada, modelo de auto, mecánico asignado y badge de color.
   - Barra de filtros reactiva (búsqueda rápida por patente/RUT/cliente, filtro por mecánico asignado y selector de fecha).
   - Banner inferior de advertencia para órdenes en espera de repuestos (`ESP`).
   - Al hacer clic en cualquier tarjeta, se abre el modal de detalle interactivo.

2. **`components/NuevaOT.jsx` (Formulario de Ingreso de Órdenes):**
   - Replica el diseño de `Nueva OT.png`.
   - Sección 01 (Datos del cliente): Nombre completo, RUT, Teléfono y Correo.
   - Sección 02 (Datos del vehículo): Patente, Marca, Modelo, Año, Kilometraje y Motivo de ingreso.
   - Tarjeta informativa lateral con fecha/hora actual y estado inicial "Ingresada".
   - Al guardar, busca o crea automáticamente el Cliente y Vehículo en Django sin duplicar, y genera la OT que aparece inmediatamente en la primera columna del Kanban.

3. **`components/DetalleOTModal.jsx` (Detalle y Transición de Estados):**
   - Replica `Detalles OT.png`.
   - Línea de tiempo visual del ciclo de vida (7 pasos) con indicadores de avance.
   - Selector interactivo para cambiar de estado rápidamente con campo de observación opcional.
   - Pestañas de Diagnóstico, Repuestos requeridos e Historial de auditoría en tiempo real.

4. **`services/api.js`:** Cliente HTTP centralizado que maneja todas las peticiones a `http://127.0.0.1:8000/api/`.

5. **`index.css`:** Sistema de diseño completo con tokens de color (`#0B192C`, `#C34A12`, etc.), tipografía Inter y controles de 48px de altura.

---

## 📝 Observaciones Críticas de Arquitectura y Próximas Mejoras (Sprint 3 y 4)

A partir de la revisión técnica del Sprint 2, se establecen las siguientes decisiones de diseño para las fases subsiguientes:

### 1. Sistema de Autenticación, Roles y Vista de Cliente
* **Personal del taller (Jefe de taller, Recepción, Mecánicos):** Implementar login formal mediante tokens (JWT / Sesión Django) con permisos basados en roles (RBAC). El mecánico dispondrá de una vista simplificada filtrada exclusivamente por sus OTs asignadas.
* **Acceso de Clientes (Sin fricción):** Los clientes externos no requerirán creación de cuenta ni contraseña. Conforme a `VistaCliente1.png`, accederán mediante una vista pública ingresando únicamente **RUT + Patente** para consultar el estado en tiempo real.
* **Modo Demostración en Desarrollo:** Incorporar temporalmente en el Sidebar un conmutador rápido de usuario/rol para facilitar las pruebas y presentaciones académicas.

### 2. Máquina de Estados Finitos (Transiciones Válidas)
* Restringir el cambio libre de estados para impedir regresiones inconsistentes (ej. no permitir que una orden en *Diagnóstico* retroceda a *Ingresada*).
* Matriz de transiciones permitidas:
  * `ING (Ingresada)` ➔ `DIA (En Diagnóstico)` | `CAN (Cancelada)`
  * `DIA (En Diagnóstico)` ➔ `ESP (Espera Repuestos)` | `REP (En Reparación)` | `CAN`
  * `ESP (Espera Repuestos)` ➔ `REP (En Reparación)` | `CAN`
  * `REP (En Reparación)` ➔ `CAL (Control de Calidad)`
  * `CAL (Control de Calidad)` ➔ `LST (Lista para Entrega)` | `REP` (si reprueba control)
  * `LST (Lista para Entrega)` ➔ `ENT (Entregada)`
  * `ENT` y `CAN` son estados terminales.

### 3. Edición Técnica en Detalle de OT (Repuestos y Observaciones)
* El formulario de *Nueva OT* se mantiene enfocado exclusivamente en la recepción (Cliente + Auto + Motivo de falla), ya que en el momento del ingreso aún no se conocen las piezas requeridas.
* En el *Modal de Detalle*, habilitar un modo de edición para que el mecánico o jefe de taller pueda actualizar el diagnóstico definitivo, los repuestos requeridos y las observaciones durante las etapas de Diagnóstico y Reparación.

### 4. Empaquetado y Distribución
* La plataforma es nativamente Web (Django REST + React Vite).
* Es compatible para despliegue en contenedores Docker (`docker-compose`).
* Puede compilarse a aplicación ejecutable de escritorio de Windows (`.exe`) mediante Electron o Tauri si se requiere instalación local para los equipos del taller.

---

## 🔮 Roadmap / Próximas Fases Sugeridas

1. **Vistas Públicas para Clientes:** Consulta en línea del estado de su vehículo ingresando únicamente su RUT o patente.
2. **Módulo de Presupuestos y Cobros:** Registro de mano de obra y costo de repuestos con cálculo de total y estado de pago.
3. **Notificaciones Automáticas:** Envío de correo o mensaje (WhatsApp/SMS) cuando la orden cambie a *"Lista para Entregar"*.
4. **Módulo de Inventario de Repuestos:** Control de stock físico del pañol de repuestos.

https://www.figma.com/design/irL309LqqRsooMsDGQ4KWQ/Sin-t%C3%ADtulo?node-id=0-1&t=tzvy2iWWA97IDwCF-1