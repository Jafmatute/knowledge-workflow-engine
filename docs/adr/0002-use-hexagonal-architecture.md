# ADR-0002: Usar arquitectura hexagonal

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

El sistema debe cambiar parsers, proveedores, renderizadores, almacenamiento y secretos sin modificar la lógica central. El dominio debe permanecer independiente de Electron, React, SQLite, SDK externos, filesystem y convenciones de Notion u Obsidian.

## Decisión

Organizar el monolito modular mediante **arquitectura hexagonal**, también conocida como Ports and Adapters. La dirección de dependencias será:

```text
Presentation → Application → Domain
Infrastructure → Application ports
Infrastructure → Domain contracts
Domain → ninguna dependencia externa
```

## Alternativas consideradas

- **Capas tradicionales:** no se adoptan como modelo principal porque suelen permitir dependencias directas hacia drivers.
- **Clean Architecture completa:** compatible, pero se evita añadir nomenclatura y capas sin valor para el MVP.
- **Organización por framework:** rechazada porque convertiría Electron, React o Drizzle en el centro estructural.

## Consecuencias

### Positivas
- dominio independiente;
- adaptadores reemplazables;
- pruebas de contrato;
- mejor control de fronteras.

### Negativas
- requiere DTO, puertos y mapeos;
- puede generar abstracciones innecesarias si se aplica sin criterio.

## Reglas derivadas

- El dominio no importa frameworks ni drivers.
- La aplicación coordina casos de uso mediante puertos.
- Infraestructura implementa puertos.
- Presentación utiliza una API interna tipada.
- Un contrato se introduce solo ante una frontera real.
