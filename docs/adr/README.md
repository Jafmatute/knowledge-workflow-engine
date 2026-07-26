# Architecture Decision Records

Este directorio contiene los Architecture Decision Records (ADR) de Knowledge Workflow Engine.

Un ADR registra una decisión técnica relevante, el contexto que la originó, las alternativas consideradas y sus consecuencias.

## ADR aceptados

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-use-modular-monolith.md) | Usar un monolito modular | Accepted |
| [0002](0002-use-hexagonal-architecture.md) | Usar arquitectura hexagonal | Accepted |
| [0003](0003-use-neutral-artifacts.md) | Generar artefactos neutrales | Accepted |
| [0004](0004-use-portable-local-workspaces.md) | Usar workspaces locales portables | Accepted |
| [0005](0005-isolate-desktop-ui-from-privileged-operations.md) | Aislar la UI de operaciones privilegiadas | Accepted |
| [0006](0006-use-electron-and-typescript.md) | Usar Electron y TypeScript | Accepted |
| [0007](0007-use-sqlite-as-rebuildable-local-index.md) | Usar SQLite como índice reconstruible | Accepted |
| [0008](0008-use-declarative-versioned-workflows.md) | Usar workflows declarativos y versionados | Accepted |
| [0009](0009-use-zod-as-runtime-schema-source.md) | Usar Zod como fuente de schemas | Accepted |
| [0010](0010-use-provider-adapters.md) | Usar adaptadores de proveedores | Accepted |

## Convención de nombres

```text
NNNN-titulo-de-la-decision.md
```

La numeración es secuencial y no se reutiliza.

## Estados permitidos

- `Proposed`
- `Accepted`
- `Superseded`
- `Deprecated`
- `Rejected`

## Estructura

```markdown
# ADR-NNNN: Título

- **Estado:**
- **Fecha:**
- **Responsables:**

## Contexto

## Decisión

## Alternativas consideradas

## Consecuencias

## Reglas derivadas
```

## Regla de uso

Una decisión aceptada no se modifica silenciosamente.

Cuando una decisión cambie:

1. crear un ADR nuevo;
2. explicar qué decisión reemplaza;
3. marcar el ADR anterior como `Superseded`;
4. actualizar los documentos afectados;
5. incluir un plan de migración cuando existan datos o código afectados.

Los ADR resumen decisiones. No deben duplicar íntegramente `project-scope.md`, `architecture.md` o `tech-stack.md`.
