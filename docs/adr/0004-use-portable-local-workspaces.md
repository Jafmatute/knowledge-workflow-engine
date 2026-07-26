# ADR-0004: Usar workspaces locales portables

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

El producto es local-first y debe conservar fuentes, documentos normalizados, ejecuciones y artefactos sin depender de una cuenta remota o base de datos opaca. El usuario debe poder respaldar, mover e inspeccionar un proyecto.

## Decisión

Cada proyecto se almacenará en un **workspace local portable y versionado** con `project.json`, `sources/`, `normalized/`, `runs/`, `artifacts/` y `logs/`. SQLite será un índice reconstruible, no la única fuente de información crítica.

## Alternativas consideradas

- **Base de datos como única fuente:** rechazada por reducir portabilidad e inspección.
- **Almacenamiento cloud:** rechazado por contradecir el alcance local-first.
- **Solo archivos sin índice:** insuficiente para consultas e historial eficientes.

## Consecuencias

### Positivas
- portabilidad y respaldo sencillo;
- recuperación ante pérdida del índice;
- independencia de servicios.

### Negativas
- se debe mantener coherencia entre archivos e índice;
- requiere versionado y migraciones.

## Reglas derivadas

- Usar rutas relativas dentro del workspace cuando sea posible.
- Versionar manifiestos y schemas.
- Utilizar escrituras atómicas.
- No sobrescribir artefactos silenciosamente.
- Los secretos no pertenecen al workspace.
