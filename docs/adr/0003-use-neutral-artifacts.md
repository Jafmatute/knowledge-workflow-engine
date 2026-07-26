# ADR-0003: Generar artefactos neutrales antes del renderizado

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

Los workflows originales estaban ligados a salidas y convenciones de un gestor específico. Esto dificulta reutilizar el mismo resultado para Notion, Obsidian o formatos genéricos y obliga a repetir llamadas al modelo al cambiar de destino.

## Decisión

Todo workflow producirá primero un **artefacto neutral, estructurado, versionado y validado**. Los tipos iniciales serán `StudySummary` y `KnowledgeGraph`. Después, renderizadores producirán Markdown, JSON, Mermaid, salidas para Notion, Obsidian y JSON Canvas. Los renderizadores no podrán invocar modelos.

## Alternativas consideradas

- **Generar directamente Markdown de destino:** rechazado por acoplamiento.
- **Conservar solo la respuesta cruda del modelo:** rechazado por falta de esquema y trazabilidad.
- **Un artefacto neutral único:** rechazado porque resumen y grafo tienen invariantes distintas.

## Consecuencias

### Positivas
- rerenderizado sin nueva llamada de IA;
- independencia del destino;
- validación local;
- pruebas deterministas.

### Negativas
- requiere transformación y schemas;
- ciertos detalles de destino se agregan después.

## Reglas derivadas

- La respuesta del modelo no es un artefacto válido hasta ser validada.
- Notion y Obsidian solo aparecen en renderizadores.
- Las coordenadas visuales no son obligatorias en `KnowledgeGraph`.
- Rerenderizar crea un nuevo `RenderedArtifact` relacionado.
