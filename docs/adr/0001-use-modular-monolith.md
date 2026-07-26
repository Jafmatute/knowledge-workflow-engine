# ADR-0001: Usar un monolito modular

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

Knowledge Workflow Engine será inicialmente una aplicación de escritorio local para un solo usuario. El MVP necesita importar fuentes, normalizar documentos, ejecutar workflows, conectarse con proveedores de inteligencia artificial, renderizar artefactos y mantener historial local. Estas capacidades requieren límites internos claros, pero no despliegues independientes ni operación distribuida.

## Decisión

Implementar el MVP como un **monolito modular**. El producto se distribuirá como una sola aplicación, pero el código se dividirá en módulos con responsabilidades y contratos explícitos. La separación en procesos de Electron o utility processes se utilizará para aislamiento y rendimiento, no para convertir módulos en servicios independientes.

## Alternativas consideradas

- **Monolito sin módulos:** rechazado porque facilitaría dependencias cruzadas y acoplamiento.
- **Microservicios:** rechazados por introducir despliegue, comunicación y fallos distribuidos innecesarios.
- **Servicios locales independientes:** rechazados como arquitectura principal por añadir coordinación sin necesidad demostrada.

## Consecuencias

### Positivas
- despliegue y desarrollo simples;
- menor complejidad operativa;
- slices verticales más fáciles de construir;
- posibilidad de extraer módulos en el futuro si existe una necesidad real.

### Negativas
- todos los módulos comparten el ciclo de release;
- una mala disciplina puede producir acoplamiento;
- los límites deberán protegerse con estructura y pruebas.

## Reglas derivadas

- No introducir microservicios durante el MVP.
- No crear servicios separados para parsing, IA o persistencia.
- Las dependencias entre módulos deben seguir `architecture.md`.
- Cualquier extracción futura requerirá un ADR nuevo.
