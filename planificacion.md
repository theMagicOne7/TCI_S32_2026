##DOMINIO
Plataforma web para seguimiento de envios en tiempo real

##DOMINIO ALTERNATIVO
Sistema de gestión, logistica y distribución de carga

# Plan de estimación — theMagicOne7

## Dominio
Sistema web para la gestión integral de despachos, asignación de cargas vehiculares y seguimiento logístico en tiempo real.
---
## Descomposición
* **Épica 1: Gestión de Despachos y Envíos**
  * **Feature 1.1: Registro de Envíos**
    * `HU-001`: Como despachante, quiero registrar una nueva orden de envío con remitente y destinatario para ingresar el paquete al sistema (RN-001).
    * `HU-002`: Como despachante, quiero calcular la tarifa del envío según peso y dimensiones para cotizar el servicio al cliente (RN-002).
  * **Feature 1.2: Seguimiento y Hoja de Ruta**
    * `HU-003`: Como cliente, quiero consultar el estado de mi envío mediante un código de tracking para conocer su ubicación (RN-003).
    * `HU-004`: Como chofer, quiero actualizar el estado de entrega del paquete para registrar entregas exitosas o visitas fallidas (RN-004).
---
## Estimación (poker planning)
| Historia | Talla | Por qué |
|:---:|:---:|---|
| **HU-001** | 3 | Formulario de alta estándar con validaciones de campos obligatorios. |
| **HU-002** | 5 | Lógica de cálculo volumétrico, reglas tarifarias y validación de topes. |
| **HU-003** | 2 | Consulta de solo lectura mediante API y renderizado del estado actual. |
| **HU-004** | 3 | Actualización de estado en base de datos con registro de fecha y hora. |
---
## Asignación
| Historia | Responsable (rol) |
|:---:|---|
| **HU-001** | Integrante 1 (Backend) |
| **HU-002** | Integrante 2 (Backend / Lógica) |
| **HU-003** | Integrante 3 (Frontend) |
| **HU-004** | Integrante 1 / 2 (Fullstack) |
---
---
## Cronograma
| Iteración | Historias | Hito |
|:---:|---|---|
| **Iteración 1** (31/08 - 02/09) | Definición de backlog, arquitectura base y HU-001 | Configuración y setup inicial del proyecto |
| **Iteración 2** (02/09 - 04/09) | Implementación de HU-002, HU-003 y HU-004 | **Hito M1:** MVP funcional con circuito básico completo |
---
*Fuente: Elaborado en base a la guía de estimación y buenas prácticas de la cátedra.*
