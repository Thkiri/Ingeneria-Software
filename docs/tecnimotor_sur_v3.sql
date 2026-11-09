-- =========================================================================
-- BASE DE DATOS: TecniMotor Sur Ltda. (MySQL 8.0+) - Versión 3 (Definitiva)
-- =========================================================================
-- NOTA ARQUITECTÓNICA (COMPATIBILIDAD SQLITE VS MYSQL):
-- 1. En el entorno de desarrollo local inicial (Sprints 1 y 2), Django opera 
--    sobre SQLite (db.sqlite3) por defecto.
-- 2. Este script corresponde al entregable de "Persistencia Definitiva" 
--    (Sprint 4 y Diagrama de Despliegue UML), diseñado específicamente para 
--    el servidor relacional de preproducción/producción en MySQL 8.0+.
-- 3. No debe ejecutarse directamente sobre SQLite debido al uso de sintaxis 
--    avanzada de MySQL (ENUM, GENERATED ALWAYS AS ... STORED, TRIGGERS, VISTAS).
-- =========================================================================

DROP DATABASE IF EXISTS tecnimotor_sur;
CREATE DATABASE tecnimotor_sur CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnimotor_sur;

-- =========================================================================
-- 1. MÓDULO DE USUARIOS Y ROLES (Herencia de clase Usuario en UML - ISO/IEC 25010)
-- =========================================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMINISTRADOR', 'JEFE_TALLER', 'RECEPCIONISTA', 'MECANICO', 'ENCARGADO_REPUESTOS') NOT NULL,
    especialidad VARCHAR(50) NULL COMMENT 'Exclusivo para rol MECANICO',
    tarifa_hora DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Exclusivo para rol MECANICO (HU-05)',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. MÓDULO DE CLIENTES Y VEHÍCULOS (HU-01, HU-08)
-- =========================================================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo VARCHAR(100)
);

CREATE TABLE vehiculos (
    patente VARCHAR(10) PRIMARY KEY,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INT NOT NULL COMMENT 'Mapeado al atributo "año" del Diagrama de Clases UML (sin ñ para evitar problemas de codificación)',
    cliente_id INT NOT NULL,
    CONSTRAINT fk_vehiculo_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices para acelerar la consulta pública sin fricción del cliente (HU-08: RUT + Patente)
CREATE INDEX idx_cliente_patente ON vehiculos(cliente_id, patente);
CREATE INDEX idx_cliente_rut ON clientes(rut);

-- =========================================================================
-- 3. MÓDULO DE INVENTARIO / PAÑOL (Diagrama de Clases - Repuesto)
-- [ESTADO: PENDIENTE DE ACTIVACIÓN FUNCIONAL - ROADMAP FASE POSTERIOR]
-- =========================================================================
-- NOTA DE ALCANCE: Según el ajuste técnico del Sprint 2 documentado en el 
-- informe, el control de stock en tiempo real y el descuento automático 
-- (HU-03 / HU-04) fueron diferidos. Se despliega la estructura física para 
-- mantener la integridad con el Diagrama de Clases UML y dejar preparado el esquema.
CREATE TABLE repuestos (
    codigo VARCHAR(30) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0 COMMENT 'Control de stock diferido a fase posterior del roadmap',
    precio_unitario DECIMAL(10,2) NOT NULL,
    encargado_id INT NULL,
    CONSTRAINT fk_repuesto_encargado FOREIGN KEY (encargado_id) 
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =========================================================================
-- 4. MÓDULO PRINCIPAL: ÓRDENES DE TRABAJO (HU-01, HU-02, HU-06, HU-11)
-- =========================================================================
-- NOTA DE NORMALIZACIÓN: Se eliminó el campo redundante `costo_mano_obra` de 
-- esta tabla para evitar inconsistencias de datos. El costo de mano de obra 
-- se calcula dinámicamente mediante SUM(costo) desde `registro_horas` y se 
-- consolida al cierre en la tabla `cobros`.
CREATE TABLE ordenes_trabajo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_orden VARCHAR(15) UNIQUE NOT NULL COMMENT 'Formato correlativo automático ej. OT-0001',
    vehiculo_patente VARCHAR(10) NOT NULL,
    cliente_id INT NOT NULL,
    mecanico_id INT NULL,
    creado_por_id INT NULL COMMENT 'Recepcionista o Jefe de Taller que registra la OT',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_estimada_entrega DATE NULL,
    estado ENUM(
        'INGRESADA',
        'EN_DIAGNOSTICO',
        'ESPERA_REPUESTOS',
        'EN_REPARACION',
        'CONTROL_CALIDAD',
        'LISTA_ENTREGA',
        'ENTREGADA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'INGRESADA',
    motivo_ingreso TEXT NOT NULL,
    diagnostico TEXT NULL,
    trabajos_realizados TEXT NULL,
    repuestos_requeridos_texto TEXT NULL COMMENT 'Activo hoy (Ajuste Sprint 2): registro descriptivo de piezas sin descontar stock',
    observaciones TEXT NULL,
    CONSTRAINT fk_ot_vehiculo FOREIGN KEY (vehiculo_patente) REFERENCES vehiculos(patente) ON UPDATE CASCADE,
    CONSTRAINT fk_ot_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_ot_mecanico FOREIGN KEY (mecanico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_ot_creador FOREIGN KEY (creado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =========================================================================
-- 5. TRAZABILIDAD Y DETALLES DE LA OT (HU-03, HU-05, HU-06, HU-07)
-- =========================================================================

-- 5.1 Detalle de Repuestos para Costeo (HU-10 / Soporte futuro HU-03 y HU-04)
CREATE TABLE detalle_repuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT NOT NULL,
    repuesto_codigo VARCHAR(30) NULL COMMENT 'PENDIENTE DE ACTIVACIÓN: NULL en fase actual (sin descuento de bodega)',
    nombre_pieza VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    CONSTRAINT fk_detalle_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_repuesto FOREIGN KEY (repuesto_codigo) REFERENCES repuestos(codigo) ON DELETE SET NULL
);

-- 5.2 Registro de Horas Hombre (HU-05 - Sprint 3)
-- NOTA DE COMPATIBILIDAD: `fecha` se define como DATE NOT NULL sin DEFAULT de 
-- función (CURRENT_DATE) para garantizar compatibilidad transversal con 
-- versiones anteriores de MySQL y migraciones desde el ORM de Django.
CREATE TABLE registro_horas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT NOT NULL,
    mecanico_id INT NOT NULL,
    horas DECIMAL(5,2) NOT NULL,
    tarifa DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL COMMENT 'Fecha suministrada por la capa de aplicación (Django timezone.now().date()) o CURDATE()',
    costo DECIMAL(10,2) GENERATED ALWAYS AS (horas * tarifa) STORED,
    CONSTRAINT fk_horas_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    CONSTRAINT fk_horas_mecanico FOREIGN KEY (mecanico_id) REFERENCES usuarios(id)
);

-- 5.3 Historial de Estados / Auditoría (HU-06)
CREATE TABLE historial_estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT NOT NULL,
    estado_anterior VARCHAR(30) NULL,
    estado_nuevo VARCHAR(30) NOT NULL,
    usuario_id INT NULL,
    observacion TEXT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 5.4 Control de Calidad (HU-07 - Sprint 3)
CREATE TABLE controles_calidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT UNIQUE NOT NULL COMMENT 'Relación 0..1 con OrdenTrabajo según Diagrama de Clases UML',
    jefe_taller_id INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT NULL,
    CONSTRAINT fk_calidad_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    CONSTRAINT fk_calidad_jefe FOREIGN KEY (jefe_taller_id) REFERENCES usuarios(id)
);

-- =========================================================================
-- 6. CIERRE: COBRO Y NOTIFICACIONES (HU-09, HU-10 - Sprints 3 y 4)
-- =========================================================================

-- 6.1 Cobro Final (HU-10)
CREATE TABLE cobros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    folio INT UNIQUE NOT NULL,
    ot_id INT UNIQUE NOT NULL COMMENT 'Relación 0..1 con OrdenTrabajo según Diagrama de Clases UML',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_repuestos DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Calculado con SELECT SUM(subtotal) FROM detalle_repuestos',
    total_mano_obra DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Calculado con SELECT SUM(costo) FROM registro_horas',
    total DECIMAL(10,2) GENERATED ALWAYS AS (total_repuestos + total_mano_obra) STORED,
    pagado BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_cobro_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE
);

-- 6.2 Notificaciones al Cliente (HU-09 - Integración SendGrid / SMS)
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ot_id INT NOT NULL,
    cliente_id INT NOT NULL,
    canal ENUM('EMAIL', 'SMS') NOT NULL DEFAULT 'EMAIL',
    tipo_evento VARCHAR(50) NOT NULL COMMENT 'Ej. VEHICULO_LISTO_ENTREGA',
    mensaje TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    enviado_exitoso BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_notif_ot FOREIGN KEY (ot_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- =========================================================================
-- 7. VISTA PARA CONSULTA PÚBLICA DEL CLIENTE SIN FRICCIÓN (HU-08 Modificada)
-- =========================================================================
-- Soporta el requerimiento actualizado: "los clientes consultarán el estado de
-- su vehículo en una vista pública ingresando su RUT y la patente".
CREATE OR REPLACE VIEW vw_consulta_publica_cliente AS
SELECT 
    c.rut AS rut_cliente,
    c.nombre AS nombre_cliente,
    v.patente AS patente_vehiculo,
    v.marca,
    v.modelo,
    v.anio,
    ot.numero_orden,
    ot.estado AS estado_actual,
    ot.fecha_ingreso,
    ot.fecha_estimada_entrega,
    ot.diagnostico
FROM ordenes_trabajo ot
INNER JOIN clientes c ON ot.cliente_id = c.id
INNER JOIN vehiculos v ON ot.vehiculo_patente = v.patente;

-- =========================================================================
-- 8. MÁQUINA DE ESTADOS FINITOS (TRIGGER DE VALIDACIÓN ESTRICTA - HU-06 / HU-07)
-- =========================================================================
-- Implementa las reglas de transición documentadas en el informe:
-- * INGRESADA -> EN_DIAGNOSTICO | CANCELADA
-- * EN_DIAGNOSTICO -> ESPERA_REPUESTOS | EN_REPARACION | CANCELADA
-- * ESPERA_REPUESTOS -> EN_REPARACION | CANCELADA
-- * EN_REPARACION -> CONTROL_CALIDAD
-- * CONTROL_CALIDAD -> LISTA_ENTREGA (requiere Control de Calidad aprobado) | EN_REPARACION
-- * LISTA_ENTREGA -> ENTREGADA
-- * ENTREGADA y CANCELADA son estados terminales.

DELIMITER //

CREATE TRIGGER trg_validar_transicion_estado_ot
BEFORE UPDATE ON ordenes_trabajo
FOR EACH ROW
BEGIN
    DECLARE v_calidad_aprobada BOOLEAN DEFAULT FALSE;

    -- Solo validar cuando el estado efectivamente cambia
    IF OLD.estado <> NEW.estado THEN
        
        -- 1. Bloqueo de estados terminales
        IF OLD.estado IN ('ENTREGADA', 'CANCELADA') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error de Máquina de Estados: ENTREGADA y CANCELADA son estados terminales y no admiten cambios.';
        END IF;

        -- 2. Validación desde INGRESADA
        IF OLD.estado = 'INGRESADA' AND NEW.estado NOT IN ('EN_DIAGNOSTICO', 'CANCELADA') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transición inválida desde INGRESADA: solo puede pasar a EN_DIAGNOSTICO o CANCELADA.';
        END IF;

        -- 3. Validación desde EN_DIAGNOSTICO
        IF OLD.estado = 'EN_DIAGNOSTICO' AND NEW.estado NOT IN ('ESPERA_REPUESTOS', 'EN_REPARACION', 'CANCELADA') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transición inválida desde EN_DIAGNOSTICO: solo puede pasar a ESPERA_REPUESTOS, EN_REPARACION o CANCELADA.';
        END IF;

        -- 4. Validación desde ESPERA_REPUESTOS
        IF OLD.estado = 'ESPERA_REPUESTOS' AND NEW.estado NOT IN ('EN_REPARACION', 'CANCELADA') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transición inválida desde ESPERA_REPUESTOS: solo puede pasar a EN_REPARACION o CANCELADA.';
        END IF;

        -- 5. Validación desde EN_REPARACION
        IF OLD.estado = 'EN_REPARACION' AND NEW.estado NOT IN ('CONTROL_CALIDAD') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transición inválida desde EN_REPARACION: solo puede avanzar a CONTROL_CALIDAD.';
        END IF;

        -- 6. Validación desde CONTROL_CALIDAD (Incluye regla de negocio HU-07)
        IF OLD.estado = 'CONTROL_CALIDAD' THEN
            IF NEW.estado NOT IN ('LISTA_ENTREGA', 'EN_REPARACION') THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Transición inválida desde CONTROL_CALIDAD: solo puede pasar a LISTA_ENTREGA o volver a EN_REPARACION.';
            END IF;

            IF NEW.estado = 'LISTA_ENTREGA' THEN
                SELECT aprobado INTO v_calidad_aprobada
                FROM controles_calidad
                WHERE ot_id = OLD.id
                LIMIT 1;

                IF v_calidad_aprobada IS NULL OR v_calidad_aprobada = FALSE THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Regla de negocio HU-07: No se puede avanzar a LISTA_ENTREGA sin un Control de Calidad aprobado.';
                END IF;
            END IF;
        END IF;

        -- 7. Validación desde LISTA_ENTREGA
        IF OLD.estado = 'LISTA_ENTREGA' AND NEW.estado NOT IN ('ENTREGADA') THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transición inválida desde LISTA_ENTREGA: solo puede avanzar a ENTREGADA.';
        END IF;

    END IF;
END;
//

DELIMITER ;

-- =========================================================================
-- 9. POBLADO DE DATOS DE PRUEBA (SEED DATA PARA CRUD Y PRUEBAS)
-- =========================================================================

-- Usuarios del taller (5 roles oficiales del UML)
INSERT INTO usuarios (rut, nombre, correo, password_hash, rol, especialidad, tarifa_hora) VALUES
('10111222-3', 'Roberto Gómez', 'admin@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'ADMINISTRADOR', NULL, 0.00),
('11222333-4', 'Sebastián Vera', 'jefe@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'JEFE_TALLER', 'Diagnóstico Avanzado', 0.00),
('12333444-5', 'Camila Soto', 'recepcion@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'RECEPCIONISTA', NULL, 0.00),
('13444555-6', 'Carlos Martínez', 'cmartinez@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'MECANICO', 'Frenos y Suspensión', 15000.00),
('14555666-7', 'Luis Silva', 'lsilva@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'MECANICO', 'Motor General y Distribución', 18000.00),
('15666777-8', 'Pedro Navarro', 'panol@tecnimotor.cl', 'pbkdf2_sha256$dummyhash', 'ENCARGADO_REPUESTOS', NULL, 0.00);

-- Clientes
INSERT INTO clientes (rut, nombre, telefono, correo) VALUES
('16777888-9', 'Juan Pérez', '+56912345678', 'juan.perez@email.com'),
('17888999-0', 'María González', '+56987654321', 'maria.g@email.com');

-- Vehículos (Con atributo anio documentado respecto al UML)
INSERT INTO vehiculos (patente, marca, modelo, anio, cliente_id) VALUES
('AB1234', 'Toyota', 'Yaris', 2019, 1),
('CD5678', 'Hyundai', 'Tucson', 2021, 2);

-- Repuestos en Pañol (Datos precargados para futura activación de inventario)
INSERT INTO repuestos (codigo, nombre, stock, precio_unitario, encargado_id) VALUES
('REP-001', 'Juego de pastillas de freno delanteras', 12, 18500.00, 6),
('REP-002', 'Líquido de frenos DOT 4 (Botella 500ml)', 25, 4500.00, 6),
('REP-003', 'Filtro de aceite original', 8, 8900.00, 6);

-- Órdenes de Trabajo (Sin columna redundante costo_mano_obra)
INSERT INTO ordenes_trabajo (
    numero_orden, vehiculo_patente, cliente_id, mecanico_id, creado_por_id,
    fecha_estimada_entrega, estado, motivo_ingreso, diagnostico, repuestos_requeridos_texto
) VALUES
(
    'OT-0001', 'AB1234', 1, 4, 3,
    DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'EN_REPARACION',
    'Chirrido fuerte al frenar en las ruedas delanteras.',
    'Desgaste severo en pastillas delanteras, discos en buen estado.',
    '1x Juego pastillas delanteras, 2x Líquido de frenos DOT 4'
),
(
    'OT-0002', 'CD5678', 2, 5, 3,
    DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'INGRESADA',
    'Ruido extraño en el motor al encender en frío.',
    NULL, NULL
);

-- Detalle de Repuestos (Orden 1 - Con repuesto_codigo NULL simulando el flujo actual sin descuento de stock)
INSERT INTO detalle_repuestos (ot_id, repuesto_codigo, nombre_pieza, cantidad, precio_unitario) VALUES
(1, NULL, 'Juego de pastillas de freno delanteras', 1, 18500.00),
(1, NULL, 'Líquido de frenos DOT 4 (Botella 500ml)', 2, 4500.00);

-- Registro de Horas Hombre (Orden 1 - Usando CURDATE() explícito en el INSERT)
INSERT INTO registro_horas (ot_id, mecanico_id, horas, tarifa, fecha) VALUES
(1, 4, 2.00, 15000.00, CURDATE());

-- Historial de Auditoría de Estados (Orden 1)
INSERT INTO historial_estados (ot_id, estado_anterior, estado_nuevo, usuario_id, observacion) VALUES
(1, NULL, 'INGRESADA', 3, 'Ingreso inicial en recepción'),
(1, 'INGRESADA', 'EN_DIAGNOSTICO', 2, 'Asignada a mecánico Carlos Martínez'),
(1, 'EN_DIAGNOSTICO', 'EN_REPARACION', 4, 'Diagnóstico completado, repuestos registrados descriptivamente');
