# ADR-0005: Aislar la interfaz de operaciones privilegiadas

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

La aplicación necesita acceder al filesystem, SQLite, red, parsers, proveedores y secretos. Exponer estas capacidades directamente al renderer aumentaría el impacto de contenido malicioso o vulnerabilidades de dependencias web.

## Decisión

La interfaz se ejecutará con privilegios mínimos:

```ts
{
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true
}
```

El preload expondrá una API limitada mediante `contextBridge`. El proceso principal validará comandos, autorizará rutas y coordinará adaptadores.

## Alternativas consideradas

- **Node.js en renderer:** rechazado por superficie de ataque.
- **Exponer `ipcRenderer` completo:** rechazado por debilitar la validación.
- **Servidor HTTP local:** rechazado por añadir puertos y autenticación innecesarios.

## Consecuencias

### Positivas
- menor superficie de ataque;
- capacidades enumeradas;
- secretos fuera del renderer.

### Negativas
- se requieren DTO y handlers;
- cada capacidad nueva necesita una API explícita.

## Reglas derivadas

- No exponer funciones genéricas de IPC.
- Validar entradas y salidas con Zod.
- No cargar contenido remoto en la ventana principal.
- Aplicar CSP restrictiva.
- Los valores secretos nunca se envían al renderer.
