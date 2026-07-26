# ADR-0008: Usar workflows declarativos y versionados

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

Los workflows originales estaban ligados a una herramienta, rutas y convenciones específicas. El producto necesita revisarlos, probarlos y evolucionarlos independientemente del proveedor y del destino.

## Decisión

Definir cada workflow mediante:

```text
workflows/<workflow-id>/<version>/
├── workflow.toml
├── prompt.md
├── output.schema.json
└── fixtures/
```

Usar TOML para metadatos, Markdown para instrucciones, Mustache para variables sin lógica, JSON Schema para estructura y SemVer para versiones.

## Alternativas consideradas

- **Workflows en TypeScript:** rechazados como definición principal por dificultar revisión de prompts.
- **Un único archivo TOML:** menos legible para instrucciones extensas.
- **Lenguaje de scripting:** rechazado por seguridad y complejidad.

## Consecuencias

### Positivas
- revisión clara en Git;
- versiones inmutables;
- independencia del proveedor;
- validación temprana.

### Negativas
- loader y validación adicionales;
- coordinación entre varios archivos.

## Reglas derivadas

- Una versión publicada es inmutable.
- No incluir API keys, rutas ni provider IDs obligatorios.
- No incluir instrucciones de persistencia.
- No incluir sintaxis obligatoria de Notion u Obsidian.
- Variables enumeradas y validadas.
