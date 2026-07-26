# ADR-0007: Usar SQLite como índice local reconstruible

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

La interfaz necesita consultar proyectos, fuentes, estados, ejecuciones y artefactos con eficiencia. Recorrer todos los archivos en cada operación sería costoso, pero usar una base como única fuente reduciría portabilidad.

## Decisión

Usar SQLite como **índice operativo local reconstruible**, con `better-sqlite3`, Drizzle ORM y Drizzle Kit. La información durable permanecerá en el workspace.

## Alternativas consideradas

- **Archivos JSON sin base:** insuficientes para consultas y transacciones.
- **PostgreSQL o MongoDB:** rechazados por requerir servicios adicionales.
- **`node:sqlite`:** no elegido inicialmente por estabilidad insuficiente para la decisión central.

## Consecuencias

### Positivas
- consultas rápidas;
- transacciones locales;
- migraciones explícitas;
- operación sin servicio externo.

### Negativas
- módulo nativo;
- rebuild para Electron;
- migraciones y reconstrucción requieren pruebas.

## Reglas derivadas

- El dominio no conoce Drizzle ni SQLite.
- Todo acceso se realiza mediante repositorios.
- No guardar secretos en SQLite.
- El índice debe poder reconstruirse.
- CI debe probar el módulo empaquetado.
