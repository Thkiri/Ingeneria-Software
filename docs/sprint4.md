# TecniMotor — Documentación y Cierre de Proyecto: Sprint 4

> **Propósito:** Registro técnico oficial del Sprint 4 (Cierre de Proyecto y Evaluación 3), consolidando el cumplimiento del 100% del Product Backlog, las políticas de contacto con el cliente, el protocolo de notificación asistida (HU-09), el control visual de presupuestos y la arquitectura de persistencia dual (SQLite / MySQL 8.0).

---

## 1. Alcance y Objetivos del Sprint 4

Dado que durante el Sprint 3 se adelantó e implementó íntegramente la **HU-08 (Portal Público de Consulta de Clientes con RUT y Patente)** junto con la operación multi-rol del taller, el **Sprint 4** se enfoca en el cierre operativo, el blindaje de reglas de negocio y la preparación para el despliegue productivo.

### Metas Funcionales y Técnicas del Sprint
* **HU-08 (Portal de Consulta de Clientes):** Validada y completada anticipadamente en el Sprint 3 (`/seguimiento` por RUT + Patente con stepper en tiempo real).
* **HU-09 (Notificación al Cliente Listo para Retiro):** Implementación de flujo de notificación telefónica asistida desde Recepción cuando la OT alcanza el estado `LISTA_ENTREGA` (`LST`), asegurando contacto directo y trazabilidad en el historial de la orden.
* **Política Estricta de Contacto de Clientes:** Estandarización de **Teléfono Obligatorio** y **Correo Electrónico Opcional** en toda la plataforma.
* **Control Visual de Presupuesto y Garantía:** Bloqueo preventivo en interfaz para impedir el paso a `EN_REPARACION` sin presupuesto aprobado, y visualización del estado de presupuesto en el panel del Jefe de Taller.
* **Persistencia Definitiva Dual (MySQL 8.0 / SQLite):** Parametrización del motor relacional en Django para soportar conexión directa a MySQL 8.0 ([`docs/tecnimotor_sur_v3.sql`](file:///c:/Users/mateo/Desktop/TecniMotor/docs/tecnimotor_sur_v3.sql)) mediante variables de entorno, preservando SQLite como motor local inmediato.

---

## 2. Reglas de Negocio Consolidadas en Sprint 4

### 2.1 Política de Contacto del Cliente (Teléfono Obligatorio)
* **Teléfono de contacto (`telefono`):** Campo **estrictamente obligatorio** (`NOT NULL` en base de datos, validado en modelo Django y formularios React). Ningún cliente ni orden de trabajo puede registrarse sin un número telefónico válido.
* **Correo electrónico (`email`):** Campo **opcional**. Se registra cuando el cliente desea recibir copia del presupuesto por vía digital.
* **Justificación operativa:** En la operación real del taller mecánico, el teléfono garantiza comunicación inmediata tanto para la aprobación del presupuesto como para el aviso de retiro del vehículo, evitando vehículos retenidos en taller por falta de respuesta a correos.

### 2.2 Protocolo de Notificación al Cliente (HU-09)
* **Decisión arquitectónica:** Se reemplaza la dependencia de pasarelas externas de correo/SMS (como SendGrid) por un **módulo de gestión telefónica asistida en Recepción**.
* **Flujo operativo:**
  1. Cuando el Jefe de Taller aprueba el Control de Calidad (`CAL` ➔ `LST`), la orden queda marcada como **Lista para Entrega**.
  2. En la interfaz de Recepción se activa una tarjeta destacada de aviso con el nombre del cliente, el teléfono de contacto directo, la patente del vehículo y el monto total liquidado a pagar (4 líneas + IVA 19%).
  3. La recepcionista realiza la llamada telefónica al cliente y pulsa **"Confirmar cliente notificado por teléfono"**, dejando constancia auditable con fecha, hora y usuario en el historial de la OT (`HistorialEstadoOT`).
* **Ventaja técnica (ISO/IEC 25010 - Fiabilidad):** Elimina puntos únicos de falla externos (caídas de red SMTP, bloqueos de spam o expiración de llaves API durante la operación o evaluación).

### 2.3 Control de Presupuesto Previo a Reparación
* Mientras una OT se encuentra en `EN_DIAGNOSTICO` (`DIA`) o `ESPERA_REPUESTOS` (`ESP`), Recepción o el Jefe de Taller registran la decisión del cliente respecto al presupuesto preliminar:
  - **Aprobado (`presupuesto_aprobado = True`):** Habilita la transición hacia `EN_REPARACION` (`REP`).
  - **Rechazado (`presupuesto_aprobado = False`):** Bloquea el paso a reparación; el Jefe de Taller procede a cancelar la orden (`CAN`) devengando exclusivamente el cobro base de diagnóstico ($15.000 + IVA).
  - **Pendiente (`presupuesto_aprobado = None`):** Se muestra advertencia visual indicando que aún falta la confirmación del cliente.

---

## 3. Estado Global del Product Backlog (100% Cubierto)

| ID | Historia de Usuario | Sprint Asignado | Estado Final |
| :--- | :--- | :---: | :---: |
| **HU-01** | Registro digital de nueva OT con cliente y vehículo | Sprint 1 / 3 | Completada |
| **HU-02** | Registro de diagnóstico técnico y piezas requeridas | Sprint 1 / 3 | Completada |
| **HU-03** | Asignación y registro de repuestos en la OT | Sprint 2 / 3 | Completada |
| **HU-04** | Estructura de repuestos e inventario en BD relacional | Sprint 2 / 4 | Completada |
| **HU-05** | Registro de horas hombre por mecánico (bloqueado en diagnóstico) | Sprint 3 | Completada |
| **HU-06** | Máquina de estados finitos con auditoría automática | Sprint 1 / 3 | Completada |
| **HU-07** | Control de calidad obligatorio con rechazo automático a reparación | Sprint 3 | Completada |
| **HU-08** | Portal público de consulta para clientes (RUT + Patente) | Sprint 3 / 4 | Completada |
| **HU-09** | Notificación al cliente cuando el vehículo está listo para entrega | Sprint 4 | Completada |
| **HU-10** | Generación de cobro final estructurado (Diagnóstico, Repuestos, MO, IVA) | Sprint 3 | Completada |
| **HU-11** | Dashboard Kanban global con filtros por estado, mecánico y búsqueda | Sprint 2 / 3 | Completada |

---

## 4. Arquitectura de Persistencia Dual (SQLite / MySQL 8.0)

Para cumplir con el Diagrama de Despliegue UML sin sacrificar la portabilidad del entorno de desarrollo y evaluación:

1. **Modo Desarrollo / Demostración Local (Por defecto):**
   - Opera automáticamente sobre `Backend/db.sqlite3` al ejecutar [`iniciar aplicacion.bat`](file:///c:/Users/mateo/Desktop/TecniMotor/iniciar%20aplicacion.bat), con todos los datos de prueba, usuarios y roles precargados.
2. **Modo Preproducción / Servidor Relacional (MySQL 8.0):**
   - Al definir la variable de entorno `DB_ENGINE=mysql` junto con las credenciales (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`), Django conmuta su motor hacia MySQL 8.0, compatible con el esquema entregable [`docs/tecnimotor_sur_v3.sql`](file:///c:/Users/mateo/Desktop/TecniMotor/docs/tecnimotor_sur_v3.sql).

---

## 5. Historial de Avance y Tareas del Sprint 4

- [x] **Paso 1: Documentación Oficial del Sprint 4** (`docs/sprint4.md`).
- [x] **Paso 2: Validación de Teléfono Obligatorio y Notificación Telefónica Asistida (HU-09).**
  - [x] Hacer obligatorio el campo `telefono` en el modelo `Cliente` (`Backend/taller/models.py`) y actualizar `docs/consideraciones_negocio.md`.
  - [x] Añadir endpoint o acción de registro de notificación telefónica en el historial de la OT.
  - [x] Incorporar tarjeta de aviso telefónico y confirmación de llamada en `DetalleRecepcion.jsx` cuando la orden está en `LST`.
- [x] **Paso 3: Control Visual de Presupuesto en el Dashboard y Modal del Jefe de Taller.**
  - [x] Mostrar badge de estado de presupuesto (*Aprobado / Rechazado / Pendiente*) en `TabDiagnostico.jsx`.
  - [x] Bloquear visualmente la transición a `EN_REPARACION` si el presupuesto está rechazado.
- [x] **Paso 4: Configuración de Persistencia Dual MySQL 8.0 / SQLite en `settings.py`.**
  - [x] Parametrizar `DATABASES` en `Backend/tecnimotor/settings.py` con soporte por variables de entorno y fallback seguro a SQLite.
  - [x] Verificación integral y pruebas de no-regresión.

