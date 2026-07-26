# ADR-0006: Usar Electron y TypeScript

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

El MVP necesita una aplicación de escritorio para Windows con acceso controlado a archivos, procesos separados, almacenamiento seguro, React y un ecosistema amplio de parsing documental. El equipo tiene experiencia con JavaScript y TypeScript.

## Decisión

Usar Electron como runtime de escritorio, Node.js 24 LTS, TypeScript estricto, ESM, Electron Forge, Vite y React. La misma plataforma de lenguaje cubrirá renderer, preload, host, workers, casos de uso, adaptadores y tooling.

## Alternativas consideradas

- **Tauri:** no elegido porque introduciría Rust y elevaría la complejidad inicial.
- **Aplicación web:** rechazada por el acceso intensivo a filesystem y el objetivo local-first.
- **C#/.NET:** viable, pero reduciría la reutilización del ecosistema Node seleccionado.

## Consecuencias

### Positivas
- un lenguaje principal;
- integración con React;
- empaquetado Windows;
- alta velocidad de desarrollo.

### Negativas
- distribución más grande;
- actualizaciones frecuentes de Electron;
- módulos nativos requieren rebuild.

## Reglas derivadas

- Usar versiones estables fijadas en lockfile.
- TypeScript estricto es obligatorio.
- Mantener seguridad según ADR-0005.
- Probar build y empaquetado en Windows.
- Sustituir Electron requiere un ADR nuevo.
