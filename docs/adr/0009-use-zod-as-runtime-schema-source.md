# ADR-0009: Usar Zod como fuente de schemas en runtime

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

TypeScript elimina tipos durante la ejecución. El sistema recibe datos no confiables desde IPC, archivos, TOML, JSON, SQLite, web y proveedores de IA.

## Decisión

Usar Zod como fuente canónica de schemas en runtime para DTO, configuración, manifiestos, documentos normalizados, workflows, artefactos, proveedores y datos persistidos. Generar JSON Schema cuando una integración externa lo requiera. La validación local con Zod será definitiva.

## Alternativas consideradas

- **Solo tipos TypeScript:** rechazado porque no protegen fronteras en runtime.
- **JSON Schema como única fuente:** viable, pero menos directa para tipos internos.
- **Validadores manuales:** rechazados por duplicación e inconsistencia.

## Consecuencias

### Positivas
- tipos derivados;
- validación uniforme;
- protección de fronteras;
- generación de JSON Schema.

### Negativas
- dependencia central;
- algunos proveedores requieren transformar schemas.

## Reglas derivadas

- Datos externos entran como `unknown`.
- No usar assertions para omitir validación.
- Versionar schemas persistidos.
- Los adaptadores no pueden relajar la validación final.
- Cambiar la fuente canónica requiere ADR y migración.
