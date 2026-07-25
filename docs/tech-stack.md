# Stack tecnológico del MVP

- **Proyecto:** Knowledge Workflow Engine
- **Documento:** Stack tecnológico del MVP
- **Estado:** Accepted
- **Versión:** 1.0
- **Fecha:** 2026-07-24
- **Documentos rectores relacionados:**
  - [`project-scope.md`](project-scope.md)
  - [`architecture.md`](architecture.md)

## 1. Propósito

Este documento selecciona las tecnologías concretas que se utilizarán para implementar el MVP de Knowledge Workflow Engine.

Las decisiones aquí registradas deben:

- respetar el alcance aprobado;
- implementar el monolito modular y la arquitectura hexagonal;
- mantener independencia de los gestores de notas;
- mantener independencia de los proveedores de inteligencia artificial;
- facilitar una aplicación local-first para Windows;
- evitar infraestructura innecesaria;
- permitir pruebas automatizadas de contratos y límites arquitectónicos.

Este documento define tecnologías aprobadas, restricciones de uso y alternativas rechazadas para el MVP.

## 2. Principios de selección

Las tecnologías se seleccionan mediante los siguientes criterios, en orden de importancia:

1. Compatibilidad con la arquitectura aprobada.
2. Madurez y mantenimiento activo.
3. Seguridad para una aplicación de escritorio con acceso local.
4. Compatibilidad con Windows 10 y Windows 11.
5. Capacidad de ejecución local sin servicios externos obligatorios.
6. Ecosistema suficiente para parsing documental.
7. Facilidad para construir adaptadores reemplazables.
8. Calidad del soporte para TypeScript.
9. Capacidad de pruebas automatizadas.
10. Complejidad operativa mínima.
11. Tamaño y rendimiento razonables para el MVP.
12. Portabilidad futura hacia macOS y Linux.

No se elegirá una tecnología únicamente por popularidad o por una posible necesidad futura.

## 3. Resumen ejecutivo del stack

| Área | Tecnología aprobada |
|---|---|
| Runtime de desarrollo | Node.js 24 LTS |
| Lenguaje | TypeScript 6.x, modo estricto |
| Módulos | ECMAScript Modules |
| Gestor de paquetes | pnpm |
| Organización del repositorio | pnpm workspaces |
| Aplicación de escritorio | Electron |
| Tooling de Electron | Electron Forge |
| Bundler y servidor de desarrollo | Vite |
| Interfaz | React 19 |
| Estilos | Tailwind CSS 4 |
| Componentes accesibles | Radix UI Primitives |
| Iconografía | Lucide |
| Estado efímero de interfaz | Zustand |
| Formularios | React Hook Form |
| Validación y schemas | Zod 4 |
| IPC | API tipada propia sobre Electron IPC |
| Base de datos local | SQLite |
| Acceso a SQLite | better-sqlite3 |
| Capa de consultas y migraciones | Drizzle ORM y Drizzle Kit |
| Definición de workflows | TOML + Markdown + JSON Schema |
| Templates de prompts | Mustache |
| PDF | pdfjs-dist |
| DOCX | Mammoth |
| PPTX | Open XML mediante ZIP + parser XML |
| Markdown | unified + remark |
| HTML | jsdom + Mozilla Readability |
| Sanitización HTML | DOMPurify |
| CSV | csv-parse |
| Detección de tipo | file-type + extensión |
| Detección de idioma | franc-min |
| Descarga web | Fetch API de Node + políticas propias |
| Validación de IP | ipaddr.js |
| Proveedor IA inicial 1 | Google Gemini mediante `@google/genai` |
| Proveedor IA inicial 2 | OpenAI mediante `openai` |
| Cola local | p-queue |
| Cancelación | AbortController / AbortSignal |
| Logging | Pino |
| Unitarias e integración | Vitest |
| Componentes React | React Testing Library |
| E2E de escritorio | Playwright |
| Mocks HTTP | MSW |
| Reglas arquitectónicas | dependency-cruiser |
| Linting | ESLint con configuración plana |
| Formato | Prettier |
| CI | GitHub Actions |
| Empaquetado Windows | Electron Forge + Squirrel.Windows |
| Secretos | Electron `safeStorage` |
| Release inicial | Instalador Windows x64 |

## 4. Runtime y lenguaje

### 4.1 Node.js 24 LTS

Se utilizará Node.js 24 LTS como runtime de desarrollo, automatización y procesos privilegiados de la aplicación.

Reglas:

- La versión se fijará mediante `.nvmrc` o archivo equivalente.
- `package.json` declarará el rango admitido mediante `engines`.
- CI utilizará la misma versión principal.
- No se utilizarán APIs experimentales o release candidate como fundamento del dominio.
- Las actualizaciones dentro de la línea LTS deberán pasar pruebas completas.

Razones:

- soporte estable durante el ciclo del MVP;
- compatibilidad con tooling moderno;
- Fetch API y AbortController disponibles;
- ecosistema amplio para parsing y escritorio;
- una sola plataforma de lenguaje para UI, host, workers y tooling.

### 4.2 TypeScript 6.x

Todo el código propio se escribirá en TypeScript.

Configuración obligatoria:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

Reglas:

- No se permitirá `any` salvo integración externa documentada y encapsulada.
- Los datos externos entrarán como `unknown`.
- Toda frontera de IPC, archivo, red, proveedor o base de datos se validará en runtime.
- Los paquetes internos usarán project references cuando aporten límites de compilación.
- La versión exacta se fijará en el lockfile.

### 4.3 ECMAScript Modules

El repositorio utilizará ESM.

Razones:

- compatibilidad con el ecosistema moderno;
- alineación con Vite y librerías actuales;
- reducción de mezclas entre CommonJS y ESM.

Los adaptadores que consuman paquetes CommonJS deberán encapsular esa diferencia.

## 5. Gestión del repositorio

### 5.1 pnpm

Se utilizará pnpm como gestor de paquetes.

Reglas:

- Se versionará `pnpm-lock.yaml`.
- No se aceptarán instalaciones con npm o Yarn en CI.
- Se declarará `packageManager` en `package.json`.
- Los scripts deberán ejecutarse desde la raíz.

Electron Forge requiere una estructura de dependencias compatible con su empaquetado. Por ello, el repositorio incluirá:

```ini
# .npmrc
node-linker=hoisted
```

Esta excepción es deliberada y deberá conservarse mientras Electron Forge la requiera.

### 5.2 Workspace

La estructura inicial será:

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
├── docs/
├── workflows/
├── fixtures/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

Distinción:

- `packages/workflows` contiene código del motor y carga de workflows.
- `/workflows` contiene definiciones declarativas versionadas.
- `packages/schemas` contiene schemas TypeScript/Zod compartidos.
- `fixtures` contiene archivos de prueba sin información sensible.

No se crearán paquetes sin un límite real de responsabilidad.

## 6. Aplicación de escritorio

### 6.1 Electron

Electron será el runtime de escritorio.

Razones:

- acceso controlado al sistema de archivos;
- integración con diálogos y shell del sistema operativo;
- soporte de procesos separados;
- ecosistema TypeScript;
- empaquetado para Windows;
- reutilización de React y herramientas web.

La aplicación tendrá:

1. renderer para interfaz;
2. proceso principal como host de aplicación;
3. utility processes para tareas pesadas;
4. preload como frontera de capacidades.

### 6.2 Política de versión de Electron

- Se utilizará una versión estable soportada.
- La versión exacta se fijará en el lockfile.
- No se usará Electron beta, nightly o alpha.
- Se revisarán actualizaciones de seguridad de manera periódica.
- Una actualización de Electron requerirá ejecutar pruebas unitarias, integración, E2E y empaquetado.

No se fijará en este documento un número menor permanente, porque Electron mantiene un ciclo de versiones más rápido que el MVP.

### 6.3 Electron Forge

Electron Forge será la herramienta oficial para:

- desarrollo;
- integración con Vite;
- rebuild de módulos nativos;
- empaquetado;
- generación del instalador;
- configuración de ASAR;
- fuses de Electron.

Se utilizará la plantilla o plugin oficial de Vite con TypeScript.

### 6.4 Vite

Vite será responsable de:

- desarrollo de la interfaz;
- bundling del renderer;
- bundling del preload;
- integración de React;
- integración de Tailwind.

No contendrá lógica de dominio.

### 6.5 Utility processes

Las siguientes tareas podrán ejecutarse mediante `utilityProcess`:

- parsing de PDF;
- parsing de DOCX y PPTX;
- normalización de documentos grandes;
- detección de idioma masiva;
- generación de renderizados grandes;
- cálculo de hashes de archivos extensos.

Reglas:

- mensajes serializables;
- sin acceso a estado visual;
- sin reglas de negocio duplicadas;
- cancelación y timeout;
- límites de concurrencia;
- terminación controlada.

## 7. Seguridad de Electron

Configuración obligatoria de ventanas:

```ts
{
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true
}
```

Reglas adicionales:

- No se expondrá `ipcRenderer` completo.
- El preload expondrá funciones específicas.
- Todo payload IPC se validará con Zod.
- Todo canal IPC estará enumerado.
- El proceso principal validará el origen del mensaje.
- No se utilizará `remote`.
- No se cargará contenido remoto en la ventana principal.
- Se aplicará una Content Security Policy restrictiva.
- Se utilizará un protocolo local propio para cargar recursos de la aplicación.
- No se habilitará navegación arbitraria.
- Los enlaces externos se abrirán mediante una política explícita.
- No se interpolará HTML no confiable.
- Las vistas previas de Markdown o Mermaid se sanitizarán.
- Los fuses reducirán capacidades de Electron no utilizadas.

## 8. Interfaz gráfica

### 8.1 React 19

React será el framework de interfaz.

Responsabilidades permitidas:

- composición de componentes;
- manejo de eventos;
- estados visuales;
- renderizado de progreso;
- vistas previas;
- navegación interna.

Responsabilidades prohibidas:

- acceder directamente a SQLite;
- invocar SDK de proveedores;
- leer secretos;
- escribir archivos sin la API interna;
- ejecutar parsers.

### 8.2 Tailwind CSS 4

Tailwind se utilizará para:

- tokens utilitarios;
- layout;
- estados responsivos;
- modo oscuro;
- consistencia visual.

El sistema de diseño mantendrá variables CSS semánticas. Los componentes no deberán depender de valores arbitrarios repetidos.

### 8.3 Radix UI Primitives

Radix proporcionará primitivas accesibles para:

- dialogs;
- dropdown menus;
- popovers;
- tabs;
- tooltips;
- context menus;
- selectores;
- scroll areas;
- switches;
- progress;
- toast cuando corresponda.

Los estilos serán propios. No se adoptará un kit visual completo como fuente de verdad.

### 8.4 Lucide

Lucide será la librería de iconos.

Reglas:

- un único sistema iconográfico;
- tamaños definidos por tokens;
- iconos acompañados de texto o etiquetas accesibles cuando su significado no sea obvio.

### 8.5 Zustand

Zustand se utilizará únicamente para estado efímero de interfaz que necesite compartirse entre componentes.

Ejemplos:

- proyecto activo;
- selección visual de fuentes;
- layout de paneles;
- filtros;
- preferencias de sesión;
- progreso proyectado recibido por IPC.

No será fuente de verdad para:

- proyectos;
- documentos;
- ejecuciones;
- artefactos;
- credenciales.

### 8.6 React Hook Form

Se utilizará para formularios de:

- creación de proyecto;
- configuración de proveedor;
- URL;
- texto pegado;
- parámetros de workflow;
- idioma;
- destinos.

Las validaciones se conectarán con Zod.

## 9. IPC tipado

Se construirá una API propia y pequeña sobre:

- `contextBridge`;
- `ipcRenderer.invoke`;
- `ipcMain.handle`;
- eventos unidireccionales para progreso.

Ejemplo conceptual:

```ts
interface DesktopApi {
  projects: {
    create(input: CreateProjectInput): Promise<ProjectDto>;
    open(input: OpenProjectInput): Promise<ProjectDto>;
  };
  sources: {
    importFiles(input: ImportFilesInput): Promise<ImportResultDto>;
  };
  executions: {
    start(input: StartExecutionInput): Promise<ExecutionDto>;
    cancel(input: CancelExecutionInput): Promise<void>;
    subscribe(listener: ExecutionEventListener): Unsubscribe;
  };
}
```

Reglas:

- DTO públicos separados de entidades internas;
- schemas Zod compartidos;
- errores serializables y normalizados;
- canales sin parámetros ambiguos;
- no se expondrá una función genérica `invoke(channel, payload)`;
- no se incorporará un framework RPC adicional en el MVP.

## 10. Validación y schemas

### 10.1 Zod 4

Zod será la fuente canónica para:

- DTO de IPC;
- configuración;
- manifiestos;
- documentos normalizados;
- solicitudes de workflow;
- artefactos neutrales;
- resultados de proveedores;
- configuración de renderizadores.

Reglas:

- datos externos como `unknown`;
- parseo obligatorio en fronteras;
- mensajes de error traducibles;
- schemas versionados para datos persistidos.

### 10.2 JSON Schema

Los artefactos que deban comunicarse a proveedores o herramientas externas tendrán JSON Schema generado y versionado.

Flujo:

```text
Zod schema
   ↓
JSON Schema generado
   ↓
archivo versionado
   ↓
adaptador de proveedor
   ↓
validación local con Zod
```

El schema local es autoritativo.

Los adaptadores de proveedores podrán transformar el schema a un subconjunto soportado, pero no podrán relajar la validación final.

## 11. Persistencia

### 11.1 SQLite

SQLite será el índice local embebido.

Contendrá proyecciones de:

- proyectos recientes;
- fuentes;
- documentos;
- ejecuciones;
- artefactos;
- errores resumidos;
- rutas;
- configuración no sensible.

El workspace seguirá siendo la fuente durable y portable.

### 11.2 better-sqlite3

Se utilizará `better-sqlite3` como driver de SQLite.

Razones:

- API estable;
- ejecución local;
- transacciones;
- buen ajuste para consultas cortas de aplicación de escritorio.

Consideraciones:

- es un módulo nativo;
- Electron Forge deberá reconstruirlo para la versión de Electron;
- deberá quedar desempaquetado de ASAR cuando corresponda;
- las operaciones se ejecutarán fuera del renderer;
- las consultas extensas no bloquearán la interfaz.

No se utilizará `node:sqlite` como base del MVP mientras su estabilidad oficial no sea suficiente para esta decisión.

### 11.3 Drizzle ORM

Drizzle se utilizará para:

- definición tipada de tablas;
- consultas;
- migraciones;
- transacciones;
- generación de SQL revisable.

Reglas:

- únicamente versiones estables;
- no se utilizarán paquetes `beta`, `rc` o `next`;
- las migraciones se versionarán;
- el dominio no conocerá Drizzle;
- los repositorios implementarán los puertos de aplicación.

### 11.4 Estrategia dual

```text
Workspace portable = fuente durable
SQLite = índice operativo reconstruible
```

Toda información crítica deberá existir o poder reconstruirse desde:

- `project.json`;
- snapshots;
- documentos normalizados;
- manifiestos;
- artefactos.

## 12. Workflows declarativos

### 12.1 Estructura

```text
workflows/
├── summary/
│   └── 1.0.0/
│       ├── workflow.toml
│       ├── prompt.md
│       ├── output.schema.json
│       └── fixtures/
└── knowledge-map/
    └── 1.0.0/
        ├── workflow.toml
        ├── prompt.md
        ├── output.schema.json
        └── fixtures/
```

### 12.2 TOML

TOML definirá metadatos y configuración declarativa.

Se utilizará `smol-toml` para lectura y escritura.

El archivo incluirá:

- identidad;
- versión semántica;
- descripción;
- parámetros;
- tipos de entrada;
- política de idioma;
- política de contexto;
- template;
- schema de salida;
- tipo de artefacto.

### 12.3 Markdown

Las instrucciones extensas se conservarán en `prompt.md`.

Razones:

- legibilidad;
- revisión en Git;
- diferencias claras;
- edición independiente de metadatos.

### 12.4 Mustache

Mustache se utilizará para placeholders de prompts.

Reglas:

- templates sin lógica;
- variables enumeradas;
- escape explícito según contexto;
- validación de variables antes de renderizar;
- contenido documental delimitado como datos no confiables.

No se permitirá ejecutar código dentro de templates.

### 12.5 Versionado

Los workflows utilizarán SemVer.

Una versión publicada será inmutable.

Cambios que alteren estructura o comportamiento producirán una nueva versión.

## 13. Parsing documental

Todos los parsers implementarán el contrato `DocumentParser`.

### 13.1 Texto plano

Tecnologías:

- `node:fs`;
- detección de BOM;
- `chardet` e `iconv-lite` como fallback de codificación.

Prioridad:

1. UTF-8;
2. BOM explícito;
3. detección;
4. error recuperable si no puede decodificarse de forma confiable.

### 13.2 Markdown

Tecnologías:

- `unified`;
- `remark-parse`;
- `remark-stringify`;
- utilidades mdast.

Se preservarán:

- encabezados;
- listas;
- bloques de código;
- enlaces;
- citas;
- tablas cuando el plugin utilizado lo soporte.

Las extensiones específicas de Obsidian se conservarán como metadatos o texto, no como semántica del dominio.

### 13.3 JSON

Se utilizará el parser nativo.

El adaptador deberá:

- validar sintaxis;
- detectar tamaño excesivo;
- producir representación estable;
- conservar estructura;
- impedir prototipos o comportamiento ejecutable;
- devolver error con ubicación cuando sea posible.

### 13.4 PDF

Se utilizará `pdfjs-dist`.

Alcance:

- texto embebido;
- páginas;
- metadatos básicos;
- orden textual razonable;
- advertencias por páginas vacías.

Fuera de alcance:

- OCR;
- interpretación de imágenes;
- reconstrucción perfecta de tablas;
- lectura semántica de diagramas.

### 13.5 DOCX

Se utilizará Mammoth.

Flujo:

```text
DOCX
  ↓
HTML semántico básico
  ↓
sanitización
  ↓
normalización a estructura documental
```

Se priorizará contenido sobre fidelidad visual.

### 13.6 PPTX

Se implementará un parser mínimo de Open XML mediante:

- `fflate` o `jszip` para ZIP;
- `fast-xml-parser` para XML.

Extraerá:

- orden de diapositivas;
- títulos;
- cajas de texto;
- notas disponibles;
- metadatos básicos.

No interpretará:

- posición visual como significado;
- SmartArt;
- gráficos;
- animaciones;
- diagramas;
- imágenes.

Esta implementación deberá estar encapsulada detrás del contrato de parser para poder sustituirse.

### 13.7 HTML y páginas web

Tecnologías:

- `jsdom`;
- `@mozilla/readability`;
- DOMPurify;
- unified para normalización posterior.

Reglas:

- JavaScript deshabilitado;
- recursos externos no ejecutados;
- contenido sanitizado;
- título, autor y fecha capturados cuando estén disponibles;
- HTML original o snapshot controlado almacenado;
- contenido principal convertido a estructura normalizada.

### 13.8 CSV

Se utilizará `csv-parse`.

El documento normalizado incluirá:

- encabezados;
- filas;
- delimitador detectado o configurado;
- advertencias;
- límites de filas y columnas.

No se tratará CSV como base de datos ni como hoja de cálculo completa.

### 13.9 Detección de tipo

Se utilizará:

1. firma de archivo mediante `file-type`;
2. MIME declarado;
3. extensión como fallback;
4. validación del parser.

La extensión nunca será la única señal para archivos binarios.

## 14. Detección de idioma

Se utilizará `franc-min`.

Representación interna:

- código ISO 639-3;
- confianza o score normalizado cuando sea posible;
- `und` para indeterminado.

Reglas:

- no afirmar idioma para texto demasiado corto;
- mostrar incertidumbre;
- detectar por documento;
- no usar el idioma detectado como instrucción de salida;
- permitir selección manual del idioma de salida.

## 15. Fuentes web

### 15.1 Cliente HTTP

Se utilizará la Fetch API disponible en Node.

Se aplicarán:

- AbortController;
- timeout propio;
- límite de tamaño;
- límite de redirecciones;
- validación de content type;
- user agent identificado;
- respuesta por streaming cuando sea necesario.

No se agregará Axios al MVP.

### 15.2 Protección SSRF

Se implementará una política propia con:

- `URL`;
- resolución DNS controlada;
- `ipaddr.js`;
- bloqueo de localhost;
- bloqueo de rangos privados, loopback, link-local y multicast;
- validación después de cada redirección;
- esquemas permitidos HTTP/HTTPS;
- límites de puertos;
- protección contra respuestas sobredimensionadas.

No se utilizará un navegador automatizado.

## 16. Proveedores de inteligencia artificial

### 16.1 Google Gemini

Se utilizará el SDK oficial `@google/genai`.

El adaptador soportará, cuando el modelo lo permita:

- salida estructurada;
- JSON Schema;
- cancelación;
- timeout;
- uso reportado;
- errores normalizados.

No se utilizará el paquete legado `@google/generativeai`.

### 16.2 OpenAI

Se utilizará el SDK oficial `openai`.

El adaptador utilizará la API recomendada por el SDK vigente y encapsulará:

- solicitud estructurada;
- selección de modelo;
- cancelación;
- timeout;
- uso;
- errores;
- compatibilidad de schema.

### 16.3 Selección de modelos

Los identificadores de modelos no se fijarán en el código del workflow.

Se almacenarán como configuración local:

```text
providerId
modelId
capabilities
displayName
lastValidatedAt
```

La aplicación permitirá introducir o seleccionar modelos compatibles.

Los proveedores declararán capacidades; el motor no asumirá igualdad funcional.

### 16.4 Contrato y pruebas

Cada adaptador deberá pasar la misma suite de contrato para:

- autenticación ausente;
- timeout;
- cancelación;
- respuesta inválida;
- schema no soportado;
- límite de contexto;
- error de red;
- error del proveedor;
- uso reportado;
- redacción de secretos.

Los tests automatizados no dependerán de llamadas reales por defecto.

## 17. Planificación de contexto

Se implementará un planificador propio y determinista.

Capacidades:

- conteo aproximado;
- límites por documento;
- segmentación por encabezados;
- preservación de procedencia;
- combinación ordenada;
- consolidación en múltiples pasos cuando sea necesario;
- advertencias por truncamiento;
- rechazo cuando no pueda preservar integridad suficiente.

No se utilizarán en el MVP:

- LangChain;
- LlamaIndex;
- embeddings;
- RAG;
- bases vectoriales;
- agentes autónomos.

## 18. Renderizadores

### 18.1 Generic Markdown

Usará unified y mdast para producir Markdown estable.

### 18.2 Generic JSON

Usará serialización determinista, UTF-8 y dos espacios de indentación.

### 18.3 Mermaid

Se implementará un serializador propio desde `KnowledgeGraph`.

Reglas:

- identificadores sanitizados;
- etiquetas escapadas;
- límites de nodos;
- dirección configurable;
- salida textual revisable.

### 18.4 Notion Markdown

Producirá Markdown preparado para importación o copia a Notion.

No llamará a la API de Notion.

Podrá incluir:

- encabezados;
- listas;
- tablas simples;
- bloques de código;
- Mermaid;
- manifiesto de assets.

### 18.5 Obsidian Markdown

Podrá producir:

- frontmatter YAML;
- wikilinks;
- embeds compatibles;
- enlaces relativos;
- referencias al documento fuente.

Se utilizará el paquete `yaml` para frontmatter.

Las convenciones de Obsidian existirán exclusivamente en este renderizador.

### 18.6 JSON Canvas

Se implementará un serializador propio conforme al formato JSON Canvas.

Funciones:

- asignación determinista de IDs;
- layout básico;
- nodos de texto, archivo y grupo cuando correspondan;
- edges etiquetados;
- dimensiones y posiciones reproducibles;
- validación antes de escribir.

El layout visual avanzado y la edición interactiva quedan fuera del MVP.

## 19. Concurrencia y cancelación

Tecnologías:

- `AbortController`;
- `AbortSignal`;
- `p-queue`.

Colas diferenciadas:

- parsing local;
- red;
- proveedor;
- renderizado.

Reglas:

- concurrencia limitada;
- prioridad explícita cuando sea necesaria;
- progreso por tarea;
- propagación de cancelación;
- ninguna cola distribuida;
- ningún Redis;
- ningún BullMQ.

## 20. Secretos

Se utilizará Electron `safeStorage`.

Reglas:

- operaciones asíncronas desde el host;
- solo referencias en SQLite;
- valores nunca enviados al renderer;
- estado visible: configurado/no configurado;
- API keys excluidas de logs;
- mecanismo de borrado explícito;
- advertencia si el almacenamiento seguro no está disponible.

No se utilizarán archivos `.env` como almacenamiento de credenciales de usuario.

Los `.env` solo podrán utilizarse en desarrollo local y permanecerán ignorados por Git.

## 21. Logging

Se utilizará Pino.

Configuración:

- JSON estructurado;
- archivos locales;
- pretty printing solo en desarrollo;
- redacción de campos sensibles;
- identificadores de correlación;
- rotación simple controlada por la aplicación;
- niveles `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

No habrá telemetría remota obligatoria.

## 22. Testing

### 22.1 Vitest

Vitest será el runner principal para:

- pruebas unitarias;
- pruebas de integración;
- pruebas de contrato;
- snapshots textuales controlados.

### 22.2 React Testing Library

Se utilizará para comportamiento de componentes y accesibilidad observable.

Se complementará con `@testing-library/user-event`.

### 22.3 Playwright

Playwright se utilizará para E2E de Electron.

Casos mínimos:

- iniciar aplicación;
- crear proyecto;
- importar archivo;
- ejecutar resumen con proveedor simulado;
- renderizar artefacto;
- abrir historial;
- cancelar ejecución;
- manejar archivo no soportado.

Debido al carácter especial del soporte Electron, se mantendrán pocas pruebas E2E críticas y se complementarán con integración extensa.

### 22.4 MSW

MSW simulará:

- proveedores;
- páginas web;
- redirecciones;
- timeouts;
- errores HTTP;
- respuestas de tamaño excesivo.

### 22.5 Fixtures

Se mantendrán fixtures pequeños para:

- TXT;
- Markdown;
- JSON;
- PDF con texto;
- PDF sin texto;
- DOCX;
- PPTX;
- HTML;
- CSV;
- documentos multilingües;
- contenido malicioso;
- schemas inválidos.

Los fixtures deberán ser redistribuibles y no contener datos privados.

### 22.6 Reglas arquitectónicas

`dependency-cruiser` validará dependencias permitidas.

Ejemplos:

- `domain` no importa infraestructura;
- `presentation` no importa drivers;
- `workflows` no importa proveedores;
- `renderers` no importan parsers;
- `providers` no importan UI.

Estas reglas se ejecutarán en CI.

## 23. Calidad de código

### 23.1 ESLint

Se utilizará configuración plana con:

- `typescript-eslint`;
- reglas de React;
- reglas de hooks;
- reglas de imports;
- prohibiciones arquitectónicas complementarias.

### 23.2 Prettier

Prettier será responsable únicamente del formato.

ESLint no duplicará reglas de estilo.

### 23.3 Scripts obligatorios

La raíz deberá exponer:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "package": "...",
    "make": "...",
    "lint": "...",
    "format:check": "...",
    "typecheck": "...",
    "test": "...",
    "test:integration": "...",
    "test:e2e": "...",
    "check:architecture": "...",
    "check": "..."
  }
}
```

`check` deberá ejecutar las validaciones necesarias antes de integrar cambios.

## 24. CI

GitHub Actions utilizará inicialmente `windows-latest`.

Pipeline mínimo:

1. checkout;
2. configurar Node 24;
3. configurar pnpm;
4. instalación congelada;
5. lint;
6. format check;
7. typecheck;
8. reglas arquitectónicas;
9. pruebas unitarias;
10. pruebas de integración;
11. build;
12. empaquetado smoke test.

Las pruebas E2E completas podrán ejecutarse en un job separado.

No se publicarán secretos ni artefactos sensibles.

## 25. Empaquetado y distribución

### 25.1 Electron Forge

Configuración:

- ASAR activado;
- desempaquetado automático de módulos nativos;
- rebuild de `better-sqlite3`;
- fuses de seguridad;
- assets incluidos explícitamente;
- source maps de producción controlados;
- archivos de desarrollo excluidos.

### 25.2 Squirrel.Windows

El instalador inicial será Squirrel.Windows para arquitectura x64.

El MVP producirá:

- instalador;
- paquete de aplicación;
- checksum;
- notas de versión;
- versión semántica.

Fuera de alcance:

- auto-update;
- Microsoft Store;
- instalador MSI empresarial;
- arquitectura ARM64 validada;
- firma obligatoria para completar el MVP.

La configuración quedará preparada para firma futura.

## 26. Versionado

Se utilizará SemVer para:

- aplicación;
- workflows;
- schemas;
- formatos de manifiesto.

El repositorio comenzará en una versión previa a 1.0 durante el MVP.

Convención:

```text
0.y.z
```

Los commits seguirán Conventional Commits:

```text
feat:
fix:
docs:
test:
refactor:
chore:
build:
ci:
```

## 27. Dependencias prohibidas durante el MVP

No se incorporarán sin modificación formal de alcance y ADR:

- Next.js;
- servidor web de producción;
- Docker como requisito de desarrollo;
- Kubernetes;
- microservicios;
- Redis;
- BullMQ;
- PostgreSQL;
- MongoDB;
- base vectorial;
- LangChain;
- LlamaIndex;
- RAG;
- Apache Tika como servicio;
- servicio Python;
- servicio Java;
- navegador automatizado;
- Puppeteer;
- OCR;
- API remota de Notion;
- SDK de Obsidian dentro del dominio;
- telemetría SaaS obligatoria;
- sistema de plugins;
- actualizador automático.

## 28. Dependencias nativas

Inicialmente, la principal dependencia nativa será `better-sqlite3`.

Reglas:

- minimizar módulos nativos;
- reconstrucción automática mediante Forge;
- prueba de empaquetado en CI;
- documentar toolchain requerido;
- aislar el driver detrás de repositorios;
- evaluar reemplazo solo mediante ADR.

Los parsers deberán preferir implementaciones JavaScript o WebAssembly cuando cumplan el alcance.

## 29. Política de dependencias

- Versiones exactas mediante lockfile.
- Dependencias directas justificadas.
- No usar paquetes abandonados.
- No usar prereleases salvo experimento fuera de `main`.
- Auditorías de seguridad periódicas.
- Actualizaciones agrupadas y verificadas.
- SDK externos encapsulados.
- Ninguna dependencia podrá atravesar capas por conveniencia.
- Eliminar dependencias no utilizadas.
- Preferir APIs estándar cuando reduzcan complejidad sin sacrificar estabilidad.

## 30. Alternativas consideradas

### 30.1 Tauri

Ventajas:

- binarios potencialmente menores;
- modelo nativo sólido;
- frontend web reutilizable.

No elegido para el MVP porque:

- introduce Rust como segundo lenguaje principal;
- eleva complejidad de parsing e integración;
- reduce velocidad inicial del equipo;
- Electron cubre mejor el ecosistema Node necesario.

Podrá reconsiderarse después del MVP mediante ADR.

### 30.2 Aplicación web

No elegida porque:

- el producto requiere acceso intensivo a archivos locales;
- el objetivo es local-first;
- introduciría servidor, autenticación y permisos adicionales;
- complicaría secretos y almacenamiento portable.

### 30.3 `node:sqlite`

No elegido inicialmente porque su nivel de estabilidad no es suficiente para ser el driver central aprobado del MVP.

Podrá evaluarse cuando sea estable y exista una migración clara.

### 30.4 LangChain o LlamaIndex

No elegidos porque:

- el MVP tiene solo dos workflows;
- añaden abstracciones y dependencias no necesarias;
- el contexto debe ser determinista;
- dificultan mantener contratos propios pequeños.

### 30.5 Apache Tika

No elegido porque requeriría Java o un servicio adicional.

Los parsers especializados cubren el alcance inicial con menor complejidad operativa.

### 30.6 Kit visual completo

No se adopta un sistema visual preconstruido como autoridad porque el producto necesita una interfaz técnica y compacta propia.

Radix aporta comportamiento accesible sin imponer apariencia.

## 31. Riesgos técnicos

| Riesgo | Mitigación |
|---|---|
| Rebuild de `better-sqlite3` | Forge, CI Windows y prueba de paquete |
| Soporte E2E de Electron | Pocas pruebas críticas y más integración |
| Extracción imperfecta de PDF | Advertencias, fixtures y alcance explícito |
| Parsing limitado de PPTX | Adaptador reemplazable y alcance textual |
| Diferencias de schemas entre proveedores | Subconjuntos por adaptador + validación local |
| Cambios frecuentes en Electron | Versión fijada y política de actualización |
| Contenido web malicioso | Sin JS, sanitización, SSRF guard y límites |
| Prompt injection | Delimitación de contenido y workflows sin herramientas |
| Bloqueo de interfaz | utility processes y colas limitadas |
| Divergencia workspace/SQLite | workspace como fuente y reconstrucción |
| Crecimiento de dependencias | política estricta y ADR para cambios relevantes |

## 32. Matriz de cumplimiento arquitectónico

| Requisito arquitectónico | Tecnología o práctica |
|---|---|
| Monolito modular | pnpm workspaces + paquetes internos |
| Arquitectura hexagonal | contratos, repositorios y adaptadores |
| UI aislada | Electron preload + contextBridge |
| Procesamiento pesado separado | utilityProcess |
| Documento normalizado | Zod + schemas versionados |
| Proveedores sustituibles | adaptadores `@google/genai` y `openai` |
| Artefactos neutrales | schemas Zod + JSON Schema |
| Renderizado sin IA | renderizadores puros |
| Workspace portable | filesystem estructurado |
| Índice reconstruible | SQLite + Drizzle |
| Secretos locales | safeStorage |
| Cancelación | AbortController |
| Concurrencia limitada | p-queue |
| Seguridad web | fetch controlado + ipaddr.js |
| Trazabilidad | manifiestos + Pino + SQLite |
| Reglas de dependencia | dependency-cruiser |
| Windows instalable | Forge + Squirrel.Windows |

## 33. Versiones y actualización del documento

Los números principales establecidos en este documento son decisiones del MVP.

Las versiones menores y parches se fijarán en el lockfile.

Cambios que requieran actualizar este documento:

- sustituir Electron;
- cambiar de lenguaje principal;
- sustituir SQLite;
- incorporar un framework de orquestación;
- añadir un servicio separado;
- cambiar el formato de workflows;
- cambiar la fuente canónica de schemas;
- introducir una dependencia nativa crítica;
- modificar el mecanismo de secretos;
- cambiar la estrategia de empaquetado.

Los cambios arquitectónicamente relevantes requerirán ADR.

## 34. ADR derivados

Después de aprobar este documento se deberán crear:

1. `0001-use-modular-monolith.md`;
2. `0002-use-hexagonal-architecture.md`;
3. `0003-use-neutral-artifacts.md`;
4. `0004-use-portable-local-workspaces.md`;
5. `0005-isolate-desktop-ui-from-privileged-operations.md`;
6. `0006-use-electron-and-typescript.md`;
7. `0007-use-sqlite-as-rebuildable-local-index.md`;
8. `0008-use-declarative-versioned-workflows.md`;
9. `0009-use-zod-as-runtime-schema-source.md`;
10. `0010-use-provider-adapters.md`.

La creación de estos ADR se incorporará al plan de implementación.

## 35. Criterios de aceptación del stack

El stack se considerará correctamente implementado cuando:

1. el repositorio pueda instalarse con pnpm;
2. Node 24 sea validado;
3. Electron abra una ventana segura;
4. React se ejecute mediante Vite;
5. el preload exponga una API limitada;
6. IPC valide entradas y salidas;
7. un utility process ejecute una tarea de prueba;
8. SQLite pueda migrarse y consultarse;
9. el workspace pueda crearse;
10. un secreto pueda guardarse y recuperarse sin llegar al renderer;
11. Vitest ejecute pruebas;
12. Playwright abra la aplicación empaquetada o de desarrollo;
13. dependency-cruiser detecte una importación prohibida;
14. Forge genere un instalador Windows;
15. CI ejecute las verificaciones obligatorias.

## 36. Próximo documento

Una vez aceptado este stack, el siguiente documento rector será:

```text
docs/implementation-plan.md
```

Ese documento dividirá la construcción en slices verticales verificables y establecerá dependencias, entregables y criterios de salida.
