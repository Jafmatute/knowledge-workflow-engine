# Knowledge Workflow Engine

Aplicación de escritorio local-first para transformar documentos y contenido web en resúmenes estructurados y mapas de conocimiento, manteniendo independencia respecto del proveedor de inteligencia artificial y del gestor de notas utilizado.

## Estado del proyecto

El proyecto completó la definición documental del MVP y se encuentra listo para iniciar:

```text
S01 — Bootstrap del repositorio y aplicación segura
```

Todavía no existe una versión funcional ni un paquete instalable.

## Objetivo del MVP

Validar un flujo completo que permita:

- crear y volver a abrir proyectos locales;
- importar uno o varios documentos;
- incorporar texto pegado y contenido desde una URL pública;
- detectar el idioma de cada fuente;
- generar resultados en el idioma seleccionado por el usuario;
- ejecutar los workflows `summary` y `knowledge-map`;
- utilizar Gemini u OpenAI sin modificar los workflows;
- producir primero artefactos neutrales;
- renderizar resultados para Notion, Obsidian y formatos genéricos;
- consultar historial, estados, errores y artefactos;
- distribuir una aplicación instalable para Windows 10 y Windows 11.

## Principios fundamentales

1. El núcleo del sistema es independiente de Notion y Obsidian.
2. Los workflows son independientes del proveedor de inteligencia artificial.
3. Todo procesamiento produce primero un artefacto neutral validado.
4. Los formatos específicos son responsabilidad de renderizadores.
5. Los parsers producen documentos normalizados antes de ejecutar workflows.
6. El workspace local es la fuente durable y portable del proyecto.
7. SQLite se utiliza como índice operativo reconstruible.
8. La interfaz no accede directamente a operaciones privilegiadas.
9. Cada cambio funcional pertenece a un slice aprobado.
10. El alcance no se amplía sin una decisión explícita.

## Flujo arquitectónico

```text
SourceReference
  → RawSource
  → ParsedDocument
  → NormalizedDocument
  → Workflow
  → NeutralArtifact
  → ArtifactRenderer
  → RenderedArtifact
```

Cambiar el destino de renderizado no debe provocar una nueva llamada al modelo.

## Workflows del MVP

### `summary`

Genera un `StudySummary` neutral y estructurado a partir de una o varias fuentes.

### `knowledge-map`

Genera un `KnowledgeGraph` neutral compuesto por nodos, relaciones y referencias a las fuentes.

No se incorporarán workflows adicionales durante el MVP.

## Destinos

### Genérico

- Markdown;
- JSON;
- Mermaid.

### Notion

- Markdown preparado;
- Mermaid;
- manifiesto de recursos.

No se utilizará la API remota de Notion durante el MVP.

### Obsidian

- Markdown;
- frontmatter y enlaces generados por el renderizador;
- JSON Canvas.

Las convenciones de Obsidian no forman parte del artefacto neutral.

## Formatos de entrada previstos

- TXT;
- Markdown;
- JSON;
- PDF con texto embebido;
- DOCX;
- PPTX;
- HTML;
- CSV;
- texto pegado;
- URL pública HTTP/HTTPS.

No se incluye OCR, interpretación visual de imágenes, audio, video ni soporte completo de XLSX.

## Stack aprobado

- Node.js 24 LTS;
- TypeScript estricto;
- pnpm workspaces;
- Electron;
- Electron Forge;
- Vite;
- React;
- Tailwind CSS;
- Radix UI;
- Zod;
- SQLite;
- better-sqlite3;
- Drizzle ORM;
- Vitest;
- Playwright;
- GitHub Actions.

Las decisiones y restricciones completas están en [`docs/tech-stack.md`](docs/tech-stack.md).

## Estructura prevista del repositorio

```text
knowledge-workflow-engine/
├── apps/
│   └── desktop/
├── packages/
│   ├── domain/
│   ├── application/
│   ├── contracts/
│   ├── infrastructure/
│   ├── workflows/
│   ├── schemas/
│   └── test-support/
├── workflows/
├── fixtures/
├── docs/
├── AGENTS.md
└── README.md
```

La estructura de código se creará durante S01. No debe adelantarse trabajo de slices posteriores.

## Documentación rectora

Leer en este orden:

1. [`docs/project-scope.md`](docs/project-scope.md)
2. [`docs/architecture.md`](docs/architecture.md)
3. [`docs/tech-stack.md`](docs/tech-stack.md)
4. [`docs/implementation-plan.md`](docs/implementation-plan.md)
5. [`AGENTS.md`](AGENTS.md)
6. [`docs/design-system.md`](docs/design-system.md)
7. [`docs/adr`](docs/adr)

En caso de contradicción, prevalece el documento ubicado antes en esta lista.

## Plan de implementación

El desarrollo está dividido en slices verticales:

```text
S00  Gobierno documental y ADR
S01  Bootstrap seguro de Electron
S02  Proyecto y workspace portable
S03  TXT y Markdown
S04  Primer resumen simulado
S05  Historial y renderizado genérico
S06  Gemini y secretos
S07  OpenAI y sustitución de proveedores
S08  Múltiples fuentes
S09  PDF, JSON y CSV
S10  DOCX, PPTX y HTML
S11  Fuentes web públicas
S12  Notion y Obsidian
S13  Knowledge map
S14  Experiencia de escritorio
S15  Cancelación y recuperación
S16  Instalador y aceptación final
```

Los detalles y criterios de salida están en [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Desarrollo

Antes de modificar el repositorio, leer [`AGENTS.md`](AGENTS.md).

Cuando los scripts existan, las validaciones mínimas serán:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm check:architecture
pnpm test
pnpm test:integration
pnpm build
```

Los cambios funcionales se realizarán mediante ramas cortas y pull requests asociados a un slice.

## Seguridad

No incluir en Git:

- API keys;
- credenciales;
- archivos `.env`;
- bases de datos locales;
- workspaces de usuario;
- documentos privados;
- logs de usuario;
- artefactos generados con información sensible.

Consultar [`SECURITY.md`](SECURITY.md) para reportar vulnerabilidades.

## Visibilidad del repositorio

El repositorio se mantiene **público durante el desarrollo del MVP**.

Esta decisión no autoriza publicar:

- secretos;
- documentos de usuario;
- respuestas privadas de proveedores;
- fixtures con información personal;
- datos de producción.

Cualquier cambio de visibilidad debe ser una decisión explícita de los mantenedores.

## Licencia

El proyecto todavía no tiene una licencia definida.

Hasta que se incorpore una licencia, el contenido del repositorio permanece sujeto a los derechos exclusivos de sus titulares y no se concede permiso general de uso, modificación o distribución.
