# Sistema de diseño del MVP

- **Proyecto:** Knowledge Workflow Engine
- **Documento:** Sistema de diseño del MVP
- **Estado:** Accepted
- **Versión:** 1.0
- **Fecha:** 2026-07-24
- **Documentos rectores relacionados:**
  - [`project-scope.md`](project-scope.md)
  - [`architecture.md`](architecture.md)
  - [`tech-stack.md`](tech-stack.md)
  - [`implementation-plan.md`](implementation-plan.md)
  - [`../AGENTS.md`](../AGENTS.md)

## 1. Propósito

Este documento define las reglas visuales, de interacción y accesibilidad para la interfaz de escritorio del MVP de Knowledge Workflow Engine.

El sistema de diseño debe permitir construir una interfaz:

- técnica;
- compacta;
- legible;
- orientada a teclado;
- consistente;
- accesible;
- adecuada para procesos largos;
- clara al mostrar estados, errores y artefactos;
- inspirada en herramientas de desarrollo como OpenCode, sin replicar su producto o identidad visual.

Este documento no define una marca comercial completa ni una biblioteca pública de componentes.

## 2. Alcance

El sistema de diseño cubre:

- layout principal;
- navegación;
- colores semánticos;
- tipografía;
- espaciado;
- tamaños;
- iconografía;
- componentes esenciales;
- estados de interacción;
- estados de ejecución;
- drag-and-drop;
- formularios;
- consola de eventos;
- vista previa de artefactos;
- accesibilidad;
- movimiento;
- densidad;
- contenido y microcopy.

Quedan fuera del MVP:

- editor visual de temas;
- personalización de colores por usuario;
- constructor de dashboards;
- animaciones complejas;
- ilustraciones de marketing;
- sistema de gráficos avanzado;
- soporte táctil especializado;
- versión móvil;
- branding comercial definitivo;
- múltiples familias tipográficas embebidas;
- kit público de componentes;
- editor visual de JSON Canvas.

## 3. Principios de diseño

## 3.1 Claridad operativa

La interfaz debe responder en todo momento:

1. ¿Qué proyecto está abierto?
2. ¿Qué fuentes están disponibles?
3. ¿Qué fuentes están seleccionadas?
4. ¿Qué workflow se ejecutará?
5. ¿Qué proveedor y modelo se usarán?
6. ¿Cuál será el idioma de salida?
7. ¿Qué destinos se generarán?
8. ¿Qué está haciendo el sistema?
9. ¿Qué terminó?
10. ¿Qué falló y qué puede hacer el usuario?

## 3.2 Densidad controlada

La aplicación mostrará información técnica suficiente sin desperdiciar espacio.

La densidad no debe producir:

- targets demasiado pequeños;
- texto ilegible;
- jerarquía confusa;
- controles sin etiquetas;
- filas difíciles de seleccionar;
- errores ocultos.

## 3.3 Teclado primero

Todos los flujos principales deben poder completarse mediante teclado.

El ratón y drag-and-drop son ayudas, no requisitos exclusivos.

## 3.4 Estado visible

Toda operación deberá mostrar:

- estado;
- progreso cuando sea medible;
- actividad cuando no sea medible;
- posibilidad de cancelar cuando corresponda;
- resultado;
- errores o advertencias;
- siguiente acción.

## 3.5 Errores accionables

Un error visible debe indicar:

- qué falló;
- qué elemento fue afectado;
- si el resto del proceso continuó;
- qué puede intentar el usuario;
- cómo acceder a detalles técnicos cuando existan.

## 3.6 Neutralidad del producto

La interfaz no debe favorecer visualmente un proveedor o gestor.

Gemini, OpenAI, Notion y Obsidian se presentarán como opciones equivalentes dentro de sus categorías.

## 3.7 Contenido antes que ornamentación

Las superficies, bordes y colores existen para organizar información y estados.

No se utilizarán:

- gradientes decorativos;
- sombras profundas;
- glassmorphism;
- fondos con ruido;
- animaciones sin función;
- tarjetas anidadas excesivamente;
- ilustraciones dentro de flujos operativos.

## 4. Tema del MVP

El MVP utilizará un tema oscuro único.

Razones:

- alineación con el carácter técnico de la herramienta;
- lectura prolongada de paneles y consola;
- coherencia con la inspiración visual;
- reducción de alcance inicial.

Los tokens se definirán semánticamente para permitir un tema claro futuro, pero el selector de tema queda fuera del MVP.

## 5. Fundamentos visuales

## 5.1 Paleta base

Los valores son referencias iniciales. La implementación deberá usar variables semánticas y no valores hexadecimales repetidos en componentes.

### Superficies

| Token | Valor | Uso |
|---|---:|---|
| `--color-bg-canvas` | `#0B0D10` | Fondo principal |
| `--color-bg-sidebar` | `#0E1116` | Sidebar y navegación |
| `--color-bg-panel` | `#11151B` | Paneles principales |
| `--color-bg-elevated` | `#171C23` | Popovers, dialogs y menús |
| `--color-bg-input` | `#0D1117` | Inputs y áreas editables |
| `--color-bg-hover` | `#1B222C` | Hover |
| `--color-bg-selected` | `#202A36` | Selección persistente |
| `--color-bg-disabled` | `#15191F` | Controles deshabilitados |

### Bordes

| Token | Valor | Uso |
|---|---:|---|
| `--color-border-subtle` | `#222933` | Separación regular |
| `--color-border-default` | `#303946` | Inputs y paneles |
| `--color-border-strong` | `#465365` | Énfasis |
| `--color-border-focus` | `#73A7FF` | Focus |
| `--color-border-danger` | `#F97070` | Error |

### Texto

| Token | Valor | Uso |
|---|---:|---|
| `--color-text-primary` | `#F1F5F9` | Texto principal |
| `--color-text-secondary` | `#AAB4C0` | Texto secundario |
| `--color-text-muted` | `#768292` | Metadatos |
| `--color-text-disabled` | `#56606D` | Deshabilitado |
| `--color-text-inverse` | `#0B0D10` | Texto sobre superficies claras |
| `--color-text-link` | `#82B1FF` | Enlaces |

### Acción y estado

| Token | Valor | Uso |
|---|---:|---|
| `--color-accent` | `#7AA2F7` | Acción primaria |
| `--color-accent-hover` | `#91B4FF` | Hover primario |
| `--color-accent-pressed` | `#628AD8` | Acción presionada |
| `--color-info` | `#62B0FF` | Información |
| `--color-success` | `#53C68C` | Éxito |
| `--color-warning` | `#E8B65C` | Advertencia |
| `--color-danger` | `#F97070` | Error |
| `--color-cancelled` | `#A78BFA` | Cancelado |
| `--color-running` | `#62B0FF` | Ejecución activa |

### Fondos semánticos

| Token | Valor |
|---|---:|
| `--color-info-bg` | `#10263A` |
| `--color-success-bg` | `#10281D` |
| `--color-warning-bg` | `#2B2211` |
| `--color-danger-bg` | `#311719` |
| `--color-cancelled-bg` | `#241B38` |

## 5.2 Uso del color

Reglas:

- ningún estado dependerá únicamente del color;
- combinar color con icono y texto;
- usar el acento solo para acciones o selección relevante;
- evitar colorear grandes áreas;
- el rojo se reserva para errores y acciones destructivas;
- el amarillo indica advertencia, no ejecución activa;
- el verde indica finalización exitosa;
- el azul indica actividad, foco o información;
- el violeta indica cancelación o interrupción voluntaria;
- no usar colores propios de las marcas de proveedores como colores dominantes.

## 5.3 Contraste

La interfaz tendrá como objetivo WCAG 2.2 nivel AA.

Requisitos:

- texto normal: contraste mínimo objetivo de 4.5:1;
- texto grande: mínimo objetivo de 3:1;
- controles e indicadores: mínimo objetivo de 3:1;
- focus visible en toda superficie;
- estados deshabilitados distinguibles sin reducir el texto a ilegibilidad.

Los valores deberán verificarse durante S14 antes de congelar tokens.

## 6. Tipografía

## 6.1 Familias

No se incluirán fuentes descargables en el MVP.

Se utilizarán stacks del sistema.

### Interfaz

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Si Inter no está instalada, se utilizará la fuente del sistema.

### Monoespaciada

```css
font-family:
  "Cascadia Code",
  "Cascadia Mono",
  "SFMono-Regular",
  Consolas,
  "Liberation Mono",
  monospace;
```

Se utilizará para:

- rutas;
- IDs;
- logs;
- código;
- nombres técnicos;
- JSON;
- Markdown;
- Mermaid;
- Canvas JSON.

## 6.2 Escala tipográfica

| Token | Tamaño | Línea | Peso | Uso |
|---|---:|---:|---:|---|
| `text-xs` | 11 px | 16 px | 400 | Metadatos densos |
| `text-sm` | 12 px | 18 px | 400 | Filas y controles compactos |
| `text-base` | 13 px | 20 px | 400 | Texto general de UI |
| `text-md` | 14 px | 22 px | 400 | Contenido y formularios |
| `text-lg` | 16 px | 24 px | 600 | Títulos de panel |
| `text-xl` | 20 px | 28 px | 600 | Títulos de vista |
| `text-2xl` | 24 px | 32 px | 650 | Estados de bienvenida |

Reglas:

- no usar texto menor de 11 px;
- controles principales usan 13 o 14 px;
- tablas y consola pueden usar 12 px;
- contenido de artefacto usa al menos 14 px;
- títulos no deben competir con el contenido operativo;
- evitar mayúsculas sostenidas en textos largos.

## 7. Espaciado

Escala base de 4 px.

| Token | Valor |
|---|---:|
| `space-0` | 0 |
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |

Reglas:

- separación interna de controles: 8–12 px;
- separación entre grupos: 16–24 px;
- páginas vacías: 32–48 px;
- evitar márgenes únicos no pertenecientes a la escala;
- filas densas pueden usar 6 px verticales mediante token específico.

## 8. Tamaños y geometría

## 8.1 Alturas

| Elemento | Altura |
|---|---:|
| Barra de herramientas | 44 px |
| Input regular | 34 px |
| Input compacto | 30 px |
| Botón regular | 34 px |
| Botón compacto | 28 px |
| Fila de fuente | mínimo 40 px |
| Tab | 34 px |
| Barra de estado | 26 px |
| Header de panel | 40 px |

## 8.2 Bordes y radios

| Token | Valor |
|---|---:|
| `radius-sm` | 4 px |
| `radius-md` | 6 px |
| `radius-lg` | 8 px |
| `radius-full` | 999 px |

Reglas:

- paneles principales no requieren grandes radios;
- inputs y botones usan 5–6 px;
- dialogs usan 8 px;
- badges pueden usar radio completo;
- evitar apariencia excesivamente redondeada.

## 8.3 Sombras

Las sombras serán mínimas.

```css
--shadow-popover: 0 12px 32px rgb(0 0 0 / 0.35);
--shadow-dialog: 0 20px 60px rgb(0 0 0 / 0.45);
```

Los paneles principales se separan mediante bordes, no sombras.

## 9. Layout principal

## 9.1 Ventana

Valores iniciales:

- tamaño recomendado: 1440 × 900;
- tamaño mínimo: 1024 × 720;
- usar barra de título nativa de Windows en el MVP;
- no implementar chrome personalizado en S01.

## 9.2 Estructura

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Application toolbar                                                 │
├──────────────┬───────────────────────────────────┬───────────────────┤
│ Sidebar      │ Main workspace                    │ Inspector /       │
│              │                                   │ artifact preview  │
│ Projects     │ Sources / Workflow / Execution    │                   │
│ Sources      │                                   │                   │
│ History      │                                   │                   │
├──────────────┴───────────────────────────────────┴───────────────────┤
│ Status bar                                                           │
└──────────────────────────────────────────────────────────────────────┘
```

## 9.3 Regiones

### Application toolbar

Contiene:

- proyecto activo;
- selector o indicador de workflow;
- proveedor y modelo;
- idioma de salida;
- destinos;
- acción principal;
- acceso a configuración.

No debe duplicar todos los controles de la vista. Puede actuar como resumen persistente.

### Sidebar

Ancho inicial:

```text
240 px
```

Rango redimensionable:

```text
200–320 px
```

Contiene:

- proyectos;
- fuentes;
- historial;
- navegación de configuración;
- conteos y estados.

### Main workspace

Es la región principal.

Contiene según la vista:

- dropzone;
- lista de fuentes;
- configuración de ejecución;
- consola;
- historial;
- detalles del proyecto.

Ancho mínimo recomendado:

```text
520 px
```

### Inspector

Ancho inicial:

```text
360 px
```

Rango:

```text
300–520 px
```

Contiene:

- detalle de fuente;
- metadatos;
- preview normalizado;
- preview de artefacto;
- errores;
- archivos generados.

Debe poder ocultarse mediante teclado o botón.

### Status bar

Contiene:

- estado global;
- número de tareas activas;
- proyecto;
- conexión/configuración del proveedor;
- versión;
- accesos a logs o diagnóstico.

## 9.4 Layout en ventana reducida

Cuando el ancho sea menor a 1180 px:

- el inspector se oculta por defecto;
- se abre como panel superpuesto o región temporal;
- la sidebar conserva navegación;
- controles secundarios pasan a overflow;
- la acción primaria permanece visible.

Cuando el ancho sea mínimo:

- no convertir la aplicación en layout móvil;
- mantener dos regiones: sidebar y contenido;
- permitir ocultar sidebar temporalmente;
- evitar horizontal scroll global.

## 10. Navegación

## 10.1 Secciones principales

```text
Projects
Sources
Runs
Artifacts
Settings
```

La terminología visible podrá localizarse.

## 10.2 Navegación secundaria

Dentro de un proyecto:

```text
Overview
Sources
Runs
Artifacts
```

No crear rutas adicionales sin un caso de uso del alcance.

## 10.3 Selección

Una selección persistente utiliza:

- fondo seleccionado;
- borde o indicador lateral;
- texto primario;
- `aria-current` cuando aplique.

Hover no debe parecer selección.

## 11. Iconografía

Se utilizará Lucide.

Tamaños:

| Contexto | Tamaño |
|---|---:|
| Botón compacto | 14 px |
| Control regular | 16 px |
| Navegación | 16 px |
| Estado destacado | 18 px |
| Estado vacío | 24–32 px |

Reglas:

- iconos decorativos llevan `aria-hidden`;
- botones solo con icono requieren `aria-label` y tooltip;
- no mezclar librerías;
- no usar emoji como iconografía funcional principal;
- estados deben usar iconos consistentes.

Iconos sugeridos:

| Concepto | Icono |
|---|---|
| Proyecto | `FolderKanban` |
| Fuente | `FileText` |
| URL | `Globe` |
| Texto pegado | `Clipboard` |
| Ejecución | `Play` |
| Historial | `History` |
| Artefacto | `FileOutput` |
| Resumen | `AlignLeft` |
| Knowledge map | `Network` |
| Notion | texto o icono neutral de página |
| Obsidian | texto o icono neutral de archivo |
| Éxito | `CheckCircle2` |
| Advertencia | `TriangleAlert` |
| Error | `CircleX` |
| Cancelado | `Ban` |
| Configuración | `Settings` |

No depender de logos de marca para comunicar destinos o proveedores.

## 12. Componentes esenciales

Solo se implementarán los componentes requeridos por los slices.

## 12.1 AppShell

Responsabilidad:

- layout principal;
- regiones;
- resize;
- persistencia efímera de tamaños;
- status bar;
- manejo de viewport.

No contiene lógica de negocio.

## 12.2 ApplicationToolbar

Debe mostrar:

- proyecto;
- contexto de ejecución;
- acción primaria;
- configuración.

La acción primaria cambia según estado:

```text
Run
Cancel
Retry
Render
```

Nunca mostrar dos acciones primarias competidoras.

## 12.3 Sidebar

Incluye:

- navegación;
- listas compactas;
- contadores;
- estados;
- opción de colapsar.

Debe soportar:

- teclado;
- selección visible;
- tooltip al colapsarse;
- scroll independiente.

## 12.4 PanelHeader

Incluye:

- título;
- descripción corta opcional;
- estado;
- acciones del panel.

Altura estable de 40 px.

## 12.5 SourceDropzone

Estados:

- idle;
- hover;
- drag-active;
- disabled;
- importing;
- error.

Contenido:

- título breve;
- formatos principales;
- acción alternativa de selección;
- indicación de selección múltiple.

Debe aceptar teclado mediante botón de selección.

No mostrar listas exhaustivas de formatos dentro de la zona.

## 12.6 SourceList

Soporta:

- filas seleccionables;
- selección múltiple;
- estado por fuente;
- tamaño;
- idioma;
- tipo;
- error;
- acciones contextuales.

Columnas mínimas:

```text
Selection | Name | Type | Language | Status | Actions
```

En modo estrecho:

- ocultar tamaño;
- conservar nombre, estado e idioma;
- mostrar detalles en inspector.

## 12.7 SourceRow

Estados:

- normal;
- hover;
- selected;
- focused;
- processing;
- ready;
- warning;
- failed;
- disabled.

La fila no debe cambiar de altura al aparecer un estado.

## 12.8 StatusBadge

Variantes:

```text
neutral
info
running
success
warning
danger
cancelled
```

Requisitos:

- texto;
- icono opcional;
- fondo suave;
- no usar solo punto de color;
- ancho ajustado al contenido.

## 12.9 WorkflowSelector

Muestra únicamente:

```text
Summary
Knowledge map
```

Cada opción incluye:

- nombre;
- descripción breve;
- tipo de artefacto.

No mostrar workflows futuros deshabilitados.

## 12.10 ProviderSelector

Muestra:

- proveedor;
- modelo;
- estado de configuración;
- capacidades relevantes;
- acción para configurar.

No muestra claves.

## 12.11 LanguageSelector

Distingue:

- idioma de salida;
- idioma detectado en fuentes.

Debe incluir búsqueda y mostrar nombre legible y código cuando sea útil.

No seleccionar automáticamente el idioma de salida únicamente por detección sin mostrarlo.

## 12.12 TargetSelector

Destinos:

```text
Generic
Notion
Obsidian
```

Permite selección múltiple.

Debe indicar formatos generados.

Ejemplo:

```text
Obsidian
Markdown + JSON Canvas
```

## 12.13 CommandPanel

Agrupa:

- workflow;
- fuentes seleccionadas;
- proveedor;
- modelo;
- idioma;
- destinos;
- parámetros;
- acción de ejecución.

Debe presentar una revisión clara antes de enviar contenido a un proveedor.

## 12.14 ExecutionConsole

Muestra eventos estructurados.

Cada evento contiene:

- hora;
- icono;
- etapa;
- mensaje;
- fuente cuando corresponda;
- detalle expandible.

Características:

- auto-scroll mientras el usuario no haya desplazado;
- pausa de auto-scroll al revisar eventos antiguos;
- filtros por nivel;
- copiar detalle;
- no mostrar secretos;
- monoespaciada;
- altura redimensionable.

No debe simular una terminal interactiva.

## 12.15 ProgressIndicator

Tipos:

- determinado;
- indeterminado;
- por etapas;
- agregado de múltiples fuentes.

No inventar porcentajes.

Si el progreso no es medible, usar actividad y etapa actual.

## 12.16 ArtifactPreview

Modos:

- Markdown renderizado;
- texto;
- JSON;
- Mermaid;
- metadatos;
- archivos generados.

Debe:

- sanitizar contenido;
- distinguir preview de contenido editable;
- permitir abrir archivo;
- permitir copiar;
- mostrar destino y ruta relativa;
- indicar si el artefacto es neutral o renderizado.

No incluir edición completa en el MVP.

## 12.17 EmptyState

Contiene:

- icono simple;
- título;
- explicación de una línea;
- una acción primaria;
- acción secundaria opcional.

No usar ilustraciones grandes.

## 12.18 ErrorState

Contiene:

- resumen;
- elemento afectado;
- código opcional;
- acción de recuperación;
- acceso a detalles.

Ejemplo:

```text
No se pudo extraer texto de “lecture.pdf”.
El archivo parece no contener texto embebido. OCR no está disponible en el MVP.

[Remove source] [View details]
```

## 12.19 Dialog

Usar para:

- crear proyecto;
- confirmar acciones destructivas;
- configurar proveedor;
- mostrar detalles técnicos extensos.

No usar dialog para acciones frecuentes que caben en panel.

## 12.20 Toast

Usar para confirmaciones breves y no críticas:

- archivo copiado;
- ruta abierta;
- configuración guardada;
- renderizado completado.

Errores que requieren acción permanecen visibles en la vista, no solo en toast.

## 12.21 ContextMenu

Usar para acciones secundarias:

- retry;
- remove;
- open original;
- open containing folder;
- copy path;
- view details.

Toda acción del menú contextual debe tener alternativa accesible.

## 13. Botones

Variantes:

```text
primary
secondary
ghost
danger
icon
```

### Primary

Una por región de decisión.

Uso:

- Run workflow;
- Create project;
- Save provider;
- Render artifact.

### Secondary

Uso:

- Select files;
- Open folder;
- Retry;
- Configure.

### Ghost

Uso:

- toolbar;
- row actions;
- collapse panel;
- copy.

### Danger

Uso:

- remove source;
- delete local configuration;
- discard unrecoverable data.

Las acciones destructivas deben requerir confirmación cuando no sean fácilmente reversibles.

## 14. Inputs y formularios

## 14.1 Label

Cada campo debe tener label visible salvo controles cuyo contexto sea inequívoco y cuenten con nombre accesible.

## 14.2 Help text

Usar para:

- límites;
- privacidad;
- comportamiento del proveedor;
- formatos producidos.

## 14.3 Error

El error aparece:

- junto al campo;
- con borde semántico;
- con icono;
- con texto específico.

No borrar el valor al fallar.

## 14.4 Selectores

Usar Radix para select, popover y dropdown.

Los selectores con muchos idiomas o modelos deben incluir búsqueda.

## 14.5 API keys

El campo:

- enmascara valor;
- permite pegar;
- no permite copiar el valor guardado;
- muestra configurado/no configurado;
- ofrece reemplazar o borrar;
- explica almacenamiento local seguro.

## 15. Drag-and-drop

## 15.1 Comportamiento

Al arrastrar archivos sobre la ventana:

- resaltar la dropzone válida;
- evitar overlays globales que oculten el contexto;
- indicar selección múltiple;
- rechazar carpetas o tipos no autorizados con mensaje claro;
- no iniciar el workflow automáticamente.

## 15.2 Importación

Después de soltar:

- crear entradas inmediatamente;
- mostrar estado por archivo;
- permitir continuar trabajando;
- mantener errores junto a la fuente;
- no mostrar un único spinner global;
- permitir retry individual.

## 16. Estados de fuente

Representación recomendada:

| Estado | Label visible | Icono | Color |
|---|---|---|---|
| `pending` | Pending | Clock | Neutral |
| `copying` | Copying | Copy | Info |
| `fetching` | Fetching | Download | Info |
| `extracting` | Extracting | ScanText | Running |
| `normalizing` | Normalizing | Workflow | Running |
| `ready` | Ready | CheckCircle2 | Success |
| `unsupported` | Unsupported | FileWarning | Warning |
| `failed` | Failed | CircleX | Danger |
| `removed` | Removed | Trash2 | Muted |

Los nombres visibles se localizan; los estados internos permanecen en inglés.

## 17. Estados de ejecución

| Estado | Label visible |
|---|---|
| `pending` | Pending |
| `preparing` | Preparing |
| `processing` | Generating |
| `validating` | Validating |
| `rendering` | Rendering |
| `completed` | Completed |
| `completed_with_errors` | Completed with errors |
| `failed` | Failed |
| `cancelled` | Cancelled |

Reglas:

- `completed_with_errors` no usa verde puro;
- mostrar resumen de éxitos y fallos;
- `cancelled` no se presenta como error;
- estados terminales muestran fecha y duración;
- el botón principal cambia a Retry cuando proceda.

## 18. Flujo de ejecución

## 18.1 Antes de ejecutar

Mostrar resumen:

```text
Workflow: Summary
Sources: 4 selected
Provider: Gemini
Model: <model>
Output language: Spanish
Targets: Generic, Obsidian
```

Cuando el proveedor sea remoto, mostrar una nota discreta:

```text
Selected source content will be sent to Gemini for processing.
```

## 18.2 Durante la ejecución

Mostrar:

- etapa;
- fuente activa;
- progreso;
- consola;
- botón Cancel;
- tiempo transcurrido;
- advertencias parciales.

No deshabilitar toda la aplicación si el usuario puede revisar contenido.

## 18.3 Después

Mostrar:

- estado final;
- duración;
- artefacto neutral;
- archivos renderizados;
- errores parciales;
- acciones para abrir, copiar o rerenderizar.

## 19. Vista previa de contenido

## 19.1 Documento normalizado

Mostrar:

- título;
- idioma;
- fuente;
- metadatos;
- secciones;
- advertencias.

No intentar replicar el layout visual del documento original.

## 19.2 Markdown

- ancho de lectura máximo aproximado de 780 px;
- encabezados compactos;
- bloques de código con scroll;
- tablas con scroll interno;
- enlaces claramente diferenciados;
- no ejecutar HTML embebido.

## 19.3 JSON

- monoespaciada;
- indentación de dos espacios;
- plegado opcional si la implementación es simple;
- copiar;
- búsqueda;
- no edición en MVP.

## 19.4 Mermaid

- sanitizar labels;
- zoom básico;
- fallback al código fuente si el diagrama no renderiza;
- indicar error del renderer sin perder el artefacto neutral.

## 20. Accesibilidad

## 20.1 Teclado

Orden de tabulación lógico.

Atajos iniciales:

| Acción | Atajo |
|---|---|
| Abrir proyecto | `Ctrl+O` |
| Crear proyecto | `Ctrl+Shift+N` |
| Agregar archivos | `Ctrl+I` |
| Ejecutar workflow | `Ctrl+Enter` |
| Cancelar ejecución | `Esc` cuando el foco no esté en un dialog |
| Abrir command panel | `Ctrl+K` |
| Mostrar/ocultar sidebar | `Ctrl+B` |
| Mostrar/ocultar inspector | `Ctrl+Shift+B` |
| Buscar en lista activa | `Ctrl+F` |
| Abrir configuración | `Ctrl+,` |

Los atajos deben mostrarse en menus y tooltips.

No interceptar atajos de edición dentro de inputs.

## 20.2 Focus

- focus visible de 2 px;
- no eliminar outline sin reemplazo;
- dialogs capturan foco;
- al cerrar dialog, devolver foco;
- al agregar fuentes, no mover foco por cada elemento;
- al fallar un formulario, mover o anunciar el primer error;
- paneles redimensionables deben ser operables por teclado cuando sea viable.

## 20.3 Lectores de pantalla

- landmarks para navegación, main e inspector;
- labels asociados;
- estados mediante `aria-live` moderado;
- no anunciar cada evento de consola;
- anunciar cambios importantes: inicio, error, finalización;
- progreso con roles apropiados;
- filas y selección con semántica clara.

## 20.4 Movimiento reducido

Respetar `prefers-reduced-motion`.

No usar animaciones imprescindibles para comprender estado.

## 21. Movimiento

Duraciones:

| Interacción | Duración |
|---|---:|
| Hover/focus | 100 ms |
| Popover/dialog | 140 ms |
| Panel collapse | 160 ms |
| Toast | 180 ms |

Easing:

```css
cubic-bezier(0.2, 0, 0, 1)
```

No animar:

- listas completas al importar;
- logs;
- progreso mediante saltos decorativos;
- previews extensas;
- layouts durante procesamiento pesado.

Usar un spinner o pulse discreto solo para actividad indeterminada.

## 22. Contenido y microcopy

## 22.1 Voz

La interfaz debe ser:

- directa;
- precisa;
- neutral;
- no promocional;
- no antropomórfica;
- consistente.

Evitar:

- “Magic”;
- “AI-powered” repetitivo;
- “Oops”;
- “Something went wrong” sin detalle;
- mensajes excesivamente amistosos durante errores técnicos.

## 22.2 Acciones

Usar verbos concretos:

```text
Create project
Add files
Add URL
Run workflow
Cancel
Retry
Render
Open artifact
Copy path
View details
```

Evitar:

```text
Continue
Proceed
Submit
Okay
```

cuando exista una acción más específica.

## 22.3 Mensajes de error

Formato:

```text
[Qué ocurrió]
[Por qué o limitación conocida]
[Acción disponible]
```

Ejemplo:

```text
The PDF contains no extractable text.
Scanned documents require OCR, which is not included in the MVP.
Remove the source or add a PDF with embedded text.
```

## 22.4 Terminología

Usar de forma consistente:

| Término | Significado |
|---|---|
| Project | Workspace local administrado |
| Source | Entrada original |
| Document | Contenido normalizado |
| Workflow | Proceso versionado |
| Run | Ejecución |
| Neutral artifact | Resultado independiente de destino |
| Rendered artifact | Archivo específico |
| Provider | Servicio de IA |
| Model | Modelo seleccionado |
| Target | Destino de renderizado |

No usar “note” como sinónimo general de artefacto porque el sistema no depende de un gestor de notas.

## 23. Localización

La arquitectura visual debe soportar textos más largos.

Reglas:

- no fijar anchos según inglés;
- labels pueden ocupar dos líneas cuando sea inevitable;
- no concatenar fragmentos traducibles;
- números, fechas y duraciones mediante formatters;
- códigos técnicos no se traducen;
- nombres de proveedores y formatos no se traducen;
- idioma inicial de interfaz puede ser inglés o español según implementación, pero los textos deben centralizarse.

La selección final del idioma inicial de UI se definirá antes de S14 si no está decidida.

## 24. Datos y tablas

Las tablas se usarán para fuentes, ejecuciones y artefactos.

Reglas:

- header persistente cuando la lista sea larga;
- selección clara;
- orden visible;
- columnas ocultables solo si existe necesidad;
- no implementar personalización avanzada;
- acciones al final;
- truncamiento con tooltip;
- rutas en monoespaciada;
- estados mediante badge;
- empty state dentro de la región.

## 25. Menús y comandos

## 25.1 Command palette

El MVP podrá incluir una command palette limitada en S14.

Comandos autorizados:

- crear/abrir proyecto;
- agregar archivo;
- agregar URL;
- navegar a fuentes;
- navegar a historial;
- ejecutar;
- abrir configuración;
- mostrar logs.

No incluir un lenguaje de comandos extensible ni plugins.

## 25.2 Menú de aplicación

Estructura mínima:

```text
File
  New Project
  Open Project
  Add Files
  Add URL
  Exit

Run
  Run Workflow
  Cancel Run

View
  Toggle Sidebar
  Toggle Inspector
  Open Logs

Help
  Documentation
  About
```

## 26. Confirmaciones

Requieren confirmación:

- eliminar una fuente cuando borre snapshot;
- borrar una credencial;
- cerrar durante una ejecución activa;
- reparar o migrar un proyecto con riesgo;
- sobrescribir una salida existente si no se versiona.

No requieren confirmación:

- copiar;
- abrir;
- filtrar;
- cambiar selección;
- cerrar un preview;
- cancelar una importación que no haya producido datos durables.

## 27. Rendimiento percibido

La interfaz debe responder visualmente en menos de una interacción perceptible para acciones locales simples.

Prácticas:

- agregar filas de fuente inmediatamente;
- usar estados intermedios;
- evitar spinner global;
- virtualizar listas solo cuando sea necesario;
- cargar previews bajo demanda;
- no renderizar JSON completo gigantesco sin límites;
- separar procesos pesados;
- conservar selección durante actualizaciones.

No mostrar progreso falso.

## 28. Componentes prohibidos o pospuestos

No construir en el MVP:

- dashboard con gráficos;
- kanban;
- editor WYSIWYG;
- editor de canvas;
- chat lateral general;
- avatar del asistente;
- timeline animado;
- sistema de temas;
- widgets arrastrables;
- tabs libres tipo navegador;
- panel de extensiones;
- marketplace;
- onboarding en múltiples pasos;
- tours interactivos;
- gamificación;
- asistentes con personalidad.

## 29. Estructura de implementación recomendada

```text
apps/desktop/src/renderer/
├── app/
├── components/
│   ├── primitives/
│   ├── layout/
│   ├── feedback/
│   ├── forms/
│   └── data-display/
├── features/
│   ├── projects/
│   ├── sources/
│   ├── runs/
│   ├── artifacts/
│   └── settings/
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── typography.css
└── i18n/
```

Reglas:

- primitives envuelven Radix cuando sea necesario;
- feature components permanecen dentro de su feature;
- no crear un paquete de design system separado durante el MVP;
- extraer componente compartido solo después de uso real;
- tokens permanecen centralizados.

## 30. API conceptual de variantes

Ejemplo:

```ts
type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type StatusTone =
  | "neutral"
  | "info"
  | "running"
  | "success"
  | "warning"
  | "danger"
  | "cancelled";

type Density = "compact" | "regular";
```

No crear variantes libres mediante strings arbitrarios.

## 31. Pruebas visuales y de interacción

Durante S14 deberán cubrirse:

- navegación por teclado;
- focus;
- dialog;
- dropdown;
- dropzone;
- selección múltiple;
- estados de fuente;
- estados de ejecución;
- errores;
- consola;
- preview;
- ventana mínima;
- textos largos;
- escala de Windows;
- contraste;
- reduced motion.

Las pruebas automatizadas deberán centrarse en comportamiento observable, no en clases CSS internas.

Snapshots visuales podrán incorporarse para vistas críticas si no aumentan excesivamente el mantenimiento.

## 32. Checklist de revisión visual

### Jerarquía

- [ ] La acción primaria es evidente.
- [ ] Proyecto y contexto están visibles.
- [ ] El contenido principal domina.
- [ ] Metadatos no compiten con títulos.

### Estados

- [ ] Carga, éxito, advertencia, error y cancelación se distinguen.
- [ ] Ningún estado depende solo de color.
- [ ] Los errores ofrecen acción.
- [ ] El progreso no es ficticio.

### Accesibilidad

- [ ] Flujo disponible por teclado.
- [ ] Focus visible.
- [ ] Labels presentes.
- [ ] Contraste verificado.
- [ ] Iconos tienen nombres accesibles cuando corresponde.

### Densidad

- [ ] Targets suficientes.
- [ ] Texto no menor de 11 px.
- [ ] Filas legibles.
- [ ] No hay tarjetas anidadas innecesarias.

### Coherencia

- [ ] Tokens semánticos.
- [ ] Lucide exclusivamente.
- [ ] Radix para primitivas aprobadas.
- [ ] Terminología consistente.
- [ ] No se introdujo un patrón nuevo sin documentar.

## 33. Criterios de aceptación del sistema de diseño

El sistema de diseño se considerará aplicado cuando:

1. la interfaz use tokens semánticos;
2. el tema oscuro sea consistente;
3. el layout soporte sidebar, workspace e inspector;
4. la ventana mínima permanezca utilizable;
5. los componentes principales estén definidos;
6. los flujos principales funcionen con teclado;
7. los estados sean visibles y no dependan solo de color;
8. los errores sean accionables;
9. la consola no exponga secretos;
10. las previews se saniticen;
11. formularios y dialogs sean accesibles;
12. los textos sean localizables;
13. no exista un kit visual alternativo;
14. no se hayan construido componentes fuera del alcance;
15. las pruebas de S14 validen interacción y accesibilidad.

## 34. Decisiones diferidas

Se decidirán cuando el slice correspondiente lo requiera:

- idioma inicial de la interfaz;
- contenido exacto de la pantalla de bienvenida;
- persistencia de tamaños de panel;
- inclusión final de command palette;
- renderer concreto de Mermaid para preview;
- estrategia de virtualización;
- visualización del costo o uso reportado;
- firma visual final de la aplicación.

Estas decisiones no bloquean S01.

## 35. Estado dentro de S00

Con este documento quedan definidos:

- principios visuales;
- layout;
- tokens;
- componentes;
- estados;
- accesibilidad;
- interacción;
- contenido.

Pendiente para completar S00:

- ADR 0001–0010;
- README actualizado;
- templates de GitHub;
- `SECURITY.md`;
- decisión explícita sobre visibilidad del repositorio.

## 36. Próximo paso

Después de aceptar este documento, crear los ADR iniciales bajo:

```text
docs/adr/
```

Los ADR deberán resumir las decisiones ya aceptadas sin duplicar íntegramente los documentos rectores.
