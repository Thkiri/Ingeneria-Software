# TecniMotor Sur Ltda. — Guía Oficial de Uso, Demostración en Vivo y Defensa Técnica

> [!WARNING]
> **Recordatorio para Evaluación 4 (Despliegue en Producción):** Eliminar este documento o deshabilitar el conmutador de Modo Demostración y el superusuario `admin` antes de pasar a un servidor público.

---

## 1. Inicio Rápido (1 Clic)

En la raíz del proyecto, haz doble clic en:
* **[`iniciar aplicacion.bat`](file:///c:/Users/mateo/Desktop/TecniMotor/iniciar%20aplicacion.bat)**

Esto levanta automáticamente dos consolas y abre el navegador:
1. **Frontend React + Vite:** `http://localhost:5173/` *(Vista principal de demostración)*
2. **Backend API REST Django:** `http://127.0.0.1:8000/api/`
3. **Admin Técnico Django:** `http://127.0.0.1:8000/admin/`

---

## 2. Credenciales de Acceso y Perfiles Activos

### A. Acceso Rápido en Pantalla de Login / Barra Superior (Modo Demostración)
En la pantalla de ingreso al taller (`Ingresar al taller`) o desde el selector superior derecho del **Topbar**, puedes cambiar en tiempo real entre los 4 usuarios reales del taller sin perder tiempo digitando claves:

| Rol en el Taller | Nombre | Usuario | Contraseña | Responsabilidad Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Jefe de Taller** | Claudio Muñoz | `claudio.munoz` | `taller2026` | Kanban global, asigna mecánicos, aprueba Calidad, Cobros, Cancela OTs y autoriza Garantías. |
| **Recepcionista** | Carolina Pérez | `carolina.perez` | `taller2026` | Crea Clientes/Vehículos/OTs, registra aprobación de presupuesto, notifica retiro por teléfono y entrega el auto. |
| **Mecánico 1** | Diego Soto | `diego.soto` | `taller2026` | Frenos y Suspensión ($15.000/h). Registra diagnóstico, repuestos y horas hombre en sus OTs. |
| **Mecánico 2** | Felipe Vargas | `felipe.vargas` | `taller2026` | Motor y Transmisión ($18.000/h). Registra diagnóstico, repuestos y horas hombre en sus OTs. |
| **Superusuario** | Administrador | `admin` | `admin123` | Gestión técnica en `http://127.0.0.1:8000/admin/`. |

### B. Datos de Prueba Rápidos para el Portal Público de Clientes (HU-08)
Para probar la consulta sin contraseña desde la pantalla inicial:
* **RUT:** `15.234.567-8` | **Patente:** `GHKL45` *(Toyota Hilux)*
* **RUT:** `12.345.678-9` | **Patente:** `BBCC12`

---

## 3. Guion Paso a Paso para Practicar la Demostración (5 a 7 Minutos)

Sigue exactamente este orden durante tu presentación para mostrar las **11 Historias de Usuario** de forma fluida y lógica:

### Acto 1: Portal Público del Cliente — Sin Fricción (HU-08)
1. Al abrir `http://localhost:5173/`, apareces en el **Portal Público de Consulta**.
2. Explica: *"El cliente no necesita crear cuenta ni recordar contraseñas. Solo ingresa su RUT y la patente de su vehículo"*.
3. Primero escribe una patente falsa (ej. `ZZZZ99`) para mostrar el **manejo de errores limpio**.
4. Luego ingresa un RUT y patente reales (o usa el de la orden que crearás a continuación) para mostrar el **Stepper vertical de 7 estados con fechas reales de auditoría**.
5. Haz clic arriba a la derecha en **"Ingresar al taller"**.

### Acto 2: Rol Recepcionista — Ingreso y CRUD de Clientes (HU-01)
1. En el Login, selecciona el acceso rápido de **Recepción (Carolina Pérez)**.
2. Ve en el menú izquierdo a **"Clientes y Vehículos"**:
   - Muestra el **CRUD de Clientes**: puedes buscar por RUT/patente, **Crear Cliente**, **Editar** su teléfono obligatorio o correo opcional, y **+ Asociar Vehículo** a un cliente existente.
3. Ve a **"Órdenes"** (o pulsa **"+ Nueva OT"**):
   - Registra un cliente (destaca que el **Teléfono es obligatorio** por regla de negocio y el correo es opcional) y los datos del vehículo con el motivo de ingreso.
   - Guarda la orden. Verás que nace automáticamente en estado **`Ingresada`** (`ING`).

### Acto 3: Rol Jefe de Taller — Asignación y Paso a Diagnóstico (HU-06, HU-11)
1. En el selector de la barra superior (`Topbar`), cambia al rol **Jefe de Taller (Claudio Muñoz)**.
2. Muestra el **Dashboard Kanban de 7 columnas** con filtros por mecánico, fecha y buscador en tiempo real.
3. Abre la tarjeta de la nueva OT en la columna *Ingresada*:
   - Intenta pasarla a *En Diagnóstico* sin mecánico para mencionar que **la máquina de estados bloquea avanzar sin mecánico asignado**.
   - En la pestaña **Diagnóstico**, asigna como Mecánico Principal a **Diego Soto** (y muestra que también existe el campo *Segundo Mecánico de Apoyo*), guarda y cámbiala a **`En Diagnóstico`**.

### Acto 4: Rol Mecánico — Diagnóstico, Repuestos y Horas Hombre (HU-02, HU-03, HU-05)
1. En el Topbar, cambia al rol **Mecánico (Diego Soto)**.
2. Muestra su vista **"Mis órdenes"**: solo ve las OTs asignadas a él (principio de mínimo privilegio).
3. Abre la OT en diagnóstico:
   - En la pestaña **Diagnóstico**, escribe la falla técnica detectada y guarda.
   - Ve a la pestaña **Repuestos** y agrega una pieza (ej. *Kit de pastillas delanteras*, cantidad `1`, precio `$35.000`). Muestra el modal de confirmación.
   - Ve a la pestaña **Horas hombre**: muestra que el sistema **prohíbe e impide registrar horas mientras está en Diagnóstico** (porque el diagnóstico ya tiene tarifa fija de $15.000).
4. Cambia a **Recepción** o **Jefe de Taller**, marca **✓ Cliente Aprobó** el presupuesto (mostrando que si marca *Rechazó*, se bloquea el paso a reparación) y avanza el estado a **`En Reparación`**.
5. Como **Mecánico**, entra ahora a la pestaña **Horas hombre** y registra `2.5` horas trabajadas. El sistema calcula automáticamente el costo según su tarifa horaria. Pasa la orden a **`Control de Calidad`**.

### Acto 5: Control de Calidad, Cobro de 4 Líneas y Entrega con Llamada (HU-07, HU-09, HU-10)
1. Cambia al rol **Jefe de Taller (Claudio Muñoz)** y abre la OT en **`Control de Calidad`**:
   - Ve a la pestaña exclusiva **Control de calidad**.
   - Explica: *"Si el jefe rechaza el control, la orden retrocede automáticamente a En Reparación. Si aprueba, pasa directo a Lista para Entrega"*. Pulsa **Aprobar Control de Calidad**.
2. Ve en el menú lateral a **"Cobros"**:
   - Selecciona la orden y muestra la **Liquidación Oficial de 4 líneas**:
     1. Revisión y diagnóstico inicial: `$15.000` (o `$0` si es reingreso por garantía).
     2. Repuestos utilizados.
     3. Mano de obra.
     4. Subtotal neto + **IVA 19%** = **Total a pagar**.
3. Cambia al rol **Recepción (Carolina Pérez)** y abre la OT que está en **`Lista para Entrega`**:
   - Muestra el cuadro azul **Aviso telefónico de retiro (HU-09)** con el número obligatorio del cliente y el monto total con IVA a informarle por teléfono.
   - Haz clic en **"Registrar llamada: Cliente notificado"** (queda guardado en el historial) y finalmente pulsa **"Marcar como Entregada"**.

---

## 4. Batería de Preguntas Frecuentes de Evaluación (Comisión / Profesor)

*(Practica respondiendo estas preguntas primero sin leer las respuestas; abajo tienes las respuestas técnicas exactas).*

1. **¿Por qué el cliente consulta solo con RUT y Patente en lugar de tener un usuario y contraseña propios?**
2. **¿Cómo garantizan que un mecánico o recepcionista no pueda cancelar una orden o saltarse etapas del flujo?**
3. **¿Por qué prohibieron registrar horas hombre durante la etapa de Diagnóstico?**
4. **¿Qué ocurre en el sistema si un vehículo ya entregado vuelve a los pocos días porque el arreglo quedó mal hecho (Garantía)?**
5. **¿Por qué decidieron hacer la notificación al cliente mediante registro de llamada telefónica en Recepción y obligar el campo teléfono en lugar de solo correo?**
6. **En su informe de avance plantearon MySQL 8.0 en el Diagrama de Despliegue, pero aquí están ejecutando SQLite local. ¿Cómo se conectan ambos mundos?**
7. **¿Cómo se calcula el cobro final y cómo evitan errores de descuadre entre repuestos y mano de obra?**
8. **¿Qué pasa si un cliente rechaza el presupuesto después de que el mecánico revisó el auto?**
9. **¿Cómo aplicaron el estándar de calidad ISO/IEC 25010 en el código que estamos viendo?**
10. **¿Por qué hay un selector de roles arriba en la barra si en producción cada trabajador tiene su cuenta?**

---

## 5. Respuestas Técnicas a las Preguntas (Solucionario de Defensa)

### Respuesta 1 (Consulta Pública sin Fricción - HU-08)
> *"Aplicamos criterios de **Usabilidad (ISO/IEC 25010)**. En las encuestas del levantamiento de requerimientos detectamos que los clientes llamaban por teléfono porque no querían registrarse en portales complejos por una reparación puntual. Al exigir la combinación **RUT del propietario + Patente del vehículo**, validamos la identidad cruzada en el endpoint público (`consulta_publica_cliente`) entregando solo el estado de avance sin exponer datos sensibles ni costos internos."*

### Respuesta 2 (Máquina de Estados Finitos y RBAC - HU-06)
> *"Implementamos dos capas de seguridad: primero, **Control de Acceso Basado en Roles (RBAC)** en la interfaz y en los perfiles (`JEFE_TALLER`, `RECEPCIONISTA`, `MECANICO`). Segundo, en el núcleo del modelo `OrdenTrabajo` programamos un diccionario estricto `TRANSICIONES_VALIDAS` y el método `registrar_cambio_estado()`. Ninguna orden puede pasar a 'Lista para Entrega' si no tiene el objeto `ControlCalidad` con `aprobado = True`, y cada transición genera automáticamente un registro inmutable en `HistorialEstadoOT` con fecha, hora y responsable."*

### Respuesta 3 (Bloqueo de Horas en Diagnóstico y Tarifa Base $15.000 - HU-05)
> *"Por regla de negocio del taller, toda revisión inicial tiene un costo fijo estandarizado de **$15.000 CLP netos**. Si permitiéramos imputar horas hombre durante el diagnóstico, se le cobraría dos veces al cliente por el mismo concepto. Por eso el método `clean()` del modelo `RegistroHoras` y la pestaña del Frontend bloquean cualquier registro de horas hasta que el cliente apruebe el presupuesto y la orden pase a `En Reparación`."*

### Respuesta 4 (Reingreso por Garantía)
> *"Cuando una orden está en estado `Entregada`, el Jefe de Taller dispone de la acción exclusiva **Autorizar Reingreso por Garantía**. Esta acción reabre la orden hacia `En Diagnóstico`, marca `reingresado_por_garantia = True` y fuerza automáticamente a nivel de modelo que `costo_diagnostico = $0`, de modo que el cliente no vuelve a pagar por el diagnóstico de una falla atribuible al taller."*

### Respuesta 5 (Teléfono Obligatorio y Notificación Telefónica - HU-09)
> *"En un taller automotriz regional como TecniMotor en Osorno, muchos clientes transportistas o particulares no revisan el correo electrónico con frecuencia, pero el 100% porta teléfono móvil. Por eso fijamos el **teléfono como campo obligatorio (`NOT NULL`)** y el correo como opcional. Al pasar la orden a `Lista para Entrega`, Recepción visualiza la tarjeta de aviso con el teléfono y el monto exacto con IVA, realiza la llamada y registra el evento auditable en el historial de la OT, eliminando además la dependencia de pasarelas SMTP externas que puedan caer o irse a spam."*

### Respuesta 6 (Persistencia Dual SQLite / MySQL 8.0)
> *"Implementamos una arquitectura de persistencia dual en `Backend/tecnimotor/settings.py` controlada por variables de entorno (`.env`). Por defecto, para desarrollo ágil y demostraciones sin dependencias de servidor externo, opera sobre SQLite (`db.sqlite3`). Cuando se despliega en el servidor de producción definiendo `DB_ENGINE=mysql`, Django conmuta automáticamente al motor MySQL 8.0 utilizando el esquema relacional definitivo entregado en `docs/tecnimotor_sur_v3.sql`."*

### Respuesta 7 (Estructura de Cobro Final - HU-10)
> *"El modelo `OrdenTrabajo` centraliza el cálculo mediante propiedades deterministas en el backend: suma el costo base de diagnóstico ($15.000 o $0 en garantía), el subtotal de todos los `DetalleRepuesto` (`cantidad × precio_unitario`) y el costo de `RegistroHoras` (`horas × tarifa_hora`). Sobre ese subtotal neto calcula exactamente el **19% de IVA** y expone las 4 líneas desglosadas tanto en la API como en la vista de Cobros."*

### Respuesta 8 (Rechazo de Presupuesto y Cancelación)
> *"Si el cliente rechaza el presupuesto informado por Recepción, se marca `presupuesto_aprobado = False`. El sistema bloquea inmediatamente el avance hacia `En Reparación` tanto en el botón del Frontend como en la validación del Backend. En ese escenario, el Jefe de Taller cancela la orden y el cliente solo paga la línea base de diagnóstico inicial ($15.000 + IVA)."*

### Respuesta 9 (Estándar ISO/IEC 25010 aplicado)
> *"Se refleja en cuatro pilares del código: **1) Adecuación Funcional:** cobertura del 100% de las 11 Historias de Usuario; **2) Usabilidad:** interfaces separadas y adaptadas a la tarea de cada rol y portal público sin login; **3) Seguridad e Integridad:** validadores de formato RUT chileno y patente, llaves foráneas con `PROTECT` para impedir borrar clientes con órdenes históricas, y segregación de permisos; **4) Mantenibilidad:** separación limpia entre API REST en Django y componentes modulares en React."*

### Respuesta 10 (Conmutador de Roles en Topbar)
> *"El selector superior se incluyó específicamente como herramienta de **Modo Demostración e Inspección Académica** (documentado desde el Sprint 2 y 3) para poder evaluar la segregación de vistas de los 4 perfiles en tiempo real durante la defensa sin cerrar e iniciar sesión repetidamente. En el paso a producción (Evaluación 4), ese selector se desactiva por variable de entorno y cada usuario queda restringido únicamente a la sesión de sus credenciales."*
