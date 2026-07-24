# Architecture Decision Records

Este directorio contendrá los registros de decisiones arquitectónicas del proyecto, conocidos como Architecture Decision Records o ADR.

Un ADR documenta una decisión técnica relevante, el contexto que la originó, las alternativas consideradas y sus consecuencias.

## Convención de nombres

Los archivos utilizarán una numeración secuencial:

```text
0001-titulo-de-la-decision.md
0002-titulo-de-la-decision.md
0003-titulo-de-la-decision.md
```

## Estados permitidos

Cada decisión deberá indicar uno de los siguientes estados:

* Proposed
* Accepted
* Superseded
* Deprecated
* Rejected

## Estructura de un ADR

```markdown
# ADR-NNNN: Título

- Estado:
- Fecha:
- Responsables:

## Contexto

## Decisión

## Alternativas consideradas

## Consecuencias

## Referencias
```

## Regla de uso

Una decisión arquitectónica aceptada no deberá modificarse silenciosamente.

Cuando una decisión cambie:

1. Se creará un nuevo ADR.
2. El nuevo ADR explicará qué decisión reemplaza.
3. El ADR anterior cambiará su estado a `Superseded`.
4. La documentación afectada deberá actualizarse.
