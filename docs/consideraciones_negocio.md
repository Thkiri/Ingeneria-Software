Perfecto. Ahora todo está claro. Aquí quedan las reglas definitivas:

---

## Reglas de Negocio Definitivas — TecniMotor

### Presupuesto

Cuando el mecánico termina el diagnóstico, el sistema genera un presupuesto estimado basado en las horas hombre aproximadas y los repuestos que el mecánico lista en ese momento. Ese presupuesto no es el cobro final, es una aproximación.

El jefe o la recepcionista contacta al cliente por correo electrónico con ese presupuesto. Si el cliente no responde por correo, la recepcionista llama por teléfono y registra en el sistema que la aprobación fue por llamada.

El sistema no puede avanzar de `EN_DIAGNOSTICO` a `EN_REPARACION` sin que el presupuesto tenga una respuesta registrada. Si el cliente aprueba, avanza. Si rechaza, va a `CANCELADA` y se genera el cobro parcial del diagnóstico.

---

### Diagnóstico — $15.000 siempre

El diagnóstico se cobra en todos los casos sin excepción. Aparece siempre como línea separada en el cobro final con el texto explícito "Revisión y diagnóstico inicial — $15.000". Así el cliente ve exactamente qué pagó por ese concepto y qué pagó por reparación.

Si el cliente rechaza el presupuesto y no hay reparación, el cobro final tiene solo esa línea de $15.000 más IVA. Nada más.

---

### Reingreso por Garantía — $0 en diagnóstico

Cuando el auto vuelve por un trabajo mal hecho el diagnóstico no se cobra. El campo `costo_diagnostico` se fija automáticamente en $0 cuando `reingresado_por_garantia = TRUE`. El sistema no le da opción al jefe de cobrarlo — es una regla fija, no una decisión caso a caso.

Si durante el reingreso se necesitan repuestos nuevos que no son responsabilidad del taller, esos sí se cobran normalmente. La mano de obra del reingreso no se cobra. Solo los materiales adicionales que el problema original no contemplaba.

---

### Permisos por Rol — Matriz completa

**Administrador:** acceso total a todo sin restricciones.

**Jefe de taller:**
- Abre OT, cambia cualquier estado, cancela OT
- Aprueba o rechaza control de calidad
- Genera cobros finales y parciales
- Autoriza reingreso por garantía
- Puede asignar un segundo mecánico a una OT
- Ve todo: cobros, horas, repuestos, historial

**Recepcionista:**
- Abre OT nueva con cliente y vehículo
- Marca entrega cuando el jefe dice que está lista
- Envía el presupuesto al cliente por correo
- Registra si el cliente aprobó o rechazó por teléfono
- No cambia estados intermedios
- No cancela OT
- No ve cobros ni tarifas

**Mecánico:**
- Ve solo sus OT asignadas
- Registra diagnóstico, repuestos usados y horas en sus OT
- No registra horas durante `EN_DIAGNOSTICO`
- Ve el cobro final de sus propias OT pero no puede editarlo
- No cambia estados, no cancela, no aprueba nada

---

### Cobro Final — Estructura exacta

Toda OT cerrada exitosamente genera un cobro con esta estructura visible para el cliente:

```
Diagnóstico inicial          $15.000
Repuestos                    $XX.XXX
Mano de obra                 $XX.XXX
─────────────────────────────────────
Subtotal neto                $XX.XXX
IVA 19%                      $XX.XXX
─────────────────────────────────────
Total a pagar                $XX.XXX
```

Todos esos valores se calculan en Django y se guardan en la BD al momento del cierre. Nunca se recalculan después.

---

### Cancelación — Solo el jefe, con cobro si hay trabajo iniciado

Solo el jefe cancela OT. Sin excepción.

Si la OT está en `INGRESADA` o `EN_DIAGNOSTICO` sin presupuesto aún: cancelación directa, cobro solo de $15.000 si ya se hizo diagnóstico, $0 si no.

Si la OT está en `EN_DIAGNOSTICO` con presupuesto rechazado por el cliente: cobro de $15.000 y cancelación.

Si la OT está en `EN_REPARACION` o posterior: el jefe debe generar primero un cobro parcial con todo lo consumido hasta ese momento más el diagnóstico, el cliente paga, y recién ahí el sistema permite marcar `CANCELADA`.

---

### Máquina de Estados — Versión final con todas las reglas

```
INGRESADA
  → EN_DIAGNOSTICO       (requiere mecánico asignado)
  → CANCELADA            (solo jefe, cobro $0)

EN_DIAGNOSTICO
  → ESPERA_REPUESTOS     (mecánico lista repuestos, jefe notifica al cliente)
  → EN_REPARACION        (requiere presupuesto aprobado por cliente)
  → CANCELADA            (solo jefe, cobro $15.000)

ESPERA_REPUESTOS
  → EN_REPARACION        (cuando llegan los repuestos)
  → CANCELADA            (solo jefe, cobro $15.000)

EN_REPARACION
  → CONTROL_CALIDAD      (mecánico termina el trabajo)
  → CANCELADA            (solo jefe, requiere cobro parcial previo)

CONTROL_CALIDAD
  → LISTA_ENTREGA        (solo si aprobado = TRUE)
  → EN_REPARACION        (si aprobado = FALSE, automático)

LISTA_ENTREGA
  → ENTREGADA            (recepcionista o jefe)

ENTREGADA
  → EN_DIAGNOSTICO       (solo jefe, solo si reingreso por garantía,
                          diagnóstico $0, mano de obra $0)

CANCELADA                (terminal absoluto, sin excepciones)
```

---

### Lo que esto significa para el Sprint 3

Tienes 4 días y tres historias de usuario que implementar. Con estas reglas definidas el orden de trabajo es:

Primero HU-07 porque el control de calidad con rechazo automático a `EN_REPARACION` es el más simple y desbloquea el flujo completo.

Segundo HU-05 con la restricción de no registrar horas en `EN_DIAGNOSTICO` y la validación de segundo mecánico solo autorizado por el jefe.

Tercero HU-10 con la estructura de cobro de cuatro líneas, el tipo de cobro completo o parcial por cancelación, y el $0 en diagnóstico para garantías.

El presupuesto y el reingreso por garantía si el tiempo no alcanza van documentados en `docs/sprint4.md` como parte del roadmap. No son bloqueantes para la presentación del 13.