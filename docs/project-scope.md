# Alcance del MVP

- **Proyecto:** Knowledge Workflow Engine
- **Documento:** Alcance del producto mínimo viable
- **Estado:** Accepted
- **Versión:** 1.0
- **Fecha:** 2026-07-24

## 1. Propósito del documento

Este documento define el alcance funcional y no funcional del MVP de Knowledge Workflow Engine.

Es la fuente de verdad para determinar:

- qué problema debe resolver el MVP;
- qué capacidades deben implementarse;
- qué limitaciones son aceptables;
- qué funcionalidades quedan excluidas;
- cómo se validará que el MVP está terminado.

Las decisiones de arquitectura, tecnologías, diseño visual y secuencia de implementación deberán respetar este alcance.

## 2. Problema

Los workflows de generación de resúmenes y mapas de conocimiento suelen quedar acoplados a:

- un proveedor o modelo específico de inteligencia artificial;
- un gestor de notas concreto;
- una estructura particular de carpetas;
- formatos de entrada limitados;
- comandos y convenciones propias de una herramienta.

Ese acoplamiento obliga a modificar prompts, comandos o código cuando el usuario cambia de modelo, gestor de notas o formato documental.

El sistema debe separar la lógica de procesamiento de las integraciones utilizadas para leer fuentes, ejecutar modelos y producir resultados.

## 3. Objetivo del MVP

Construir una aplicación de escritorio local que permita importar documentos o contenido web, normalizar su contenido, ejecutar workflows de inteligencia artificial y generar artefactos reutilizables para distintos gestores de notas.

El MVP debe demostrar que:

1. un mismo workflow puede ejecutarse con diferentes proveedores de inteligencia artificial;
2. una misma fuente puede producir salidas para diferentes gestores de notas;
3. cambiar el formato de entrada no modifica la lógica del workflow;
4. los resultados específicos de Notion u Obsidian se generan desde un artefacto neutral;
5. el procesamiento puede ejecutarse localmente desde una interfaz gráfica coherente.

## 4. Usuario objetivo

El MVP está dirigido inicialmente a un usuario individual que:

- documenta conocimiento técnico, académico o profesional;
- trabaja con documentos provenientes de diferentes fuentes;
- utiliza o puede cambiar entre Notion, Obsidian u otros gestores;
- necesita generar resúmenes estructurados y mapas de conocimiento;
- desea seleccionar el proveedor de inteligencia artificial sin rediseñar sus workflows.

El MVP no contempla colaboración multiusuario ni administración organizacional.

## 5. Principios obligatorios

1. **Agnosticidad del gestor:** el dominio y los workflows no conocerán Notion, Obsidian ni sus convenciones particulares.
2. **Agnosticidad del modelo:** los workflows no dependerán de un proveedor o modelo específico.
3. **Artefacto neutral primero:** todo workflow generará una representación neutral antes de producir formatos específicos.
4. **Local-first:** proyectos, fuentes, configuraciones, ejecuciones y artefactos se administrarán localmente.
5. **Procesamiento reproducible:** cada ejecución registrará sus entradas, configuración, resultado y estado.
6. **Tolerancia parcial a errores:** el fallo de una fuente no cancelará automáticamente las demás fuentes de la ejecución.
7. **Alcance controlado:** ninguna capacidad fuera de este documento se implementará sin una decisión explícita.
8. **Separación de responsabilidades:** lectura, parsing, workflows, modelos, renderizado y publicación serán responsabilidades diferenciadas.

## 6. Flujo principal del usuario

El MVP deberá soportar el siguiente flujo completo:

1. El usuario crea o abre un proyecto local.
2. Agrega una o varias fuentes mediante archivos, texto pegado o URL pública.
3. El sistema identifica el tipo de fuente y extrae su contenido.
4. El sistema detecta el idioma de cada documento.
5. El usuario selecciona las fuentes que desea procesar.
6. El usuario selecciona un workflow.
7. El usuario selecciona el idioma de salida.
8. El usuario selecciona un proveedor y modelo configurado.
9. El usuario selecciona uno o varios destinos de renderizado.
10. El sistema ejecuta el workflow y genera un artefacto neutral.
11. El sistema renderiza el artefacto para los destinos seleccionados.
12. El sistema guarda los resultados en una estructura determinista de carpetas.
13. El usuario revisa el resultado, el estado de las fuentes y los errores producidos.

## 7. Capacidades incluidas

### 7.1 Gestión local de proyectos

El usuario podrá:

- crear un proyecto;
- abrir un proyecto existente;
- consultar proyectos recientes;
- seleccionar la ubicación local del proyecto;
- conservar fuentes, ejecuciones y artefactos dentro del workspace del proyecto.

Cada proyecto tendrá un identificador, nombre, fecha de creación, fecha de modificación y configuración local.

### 7.2 Incorporación de fuentes

El sistema permitirá agregar fuentes mediante:

- selección desde el sistema de archivos;
- drag-and-drop;
- selección múltiple de archivos;
- arrastre de una carpeta compatible;
- texto pegado directamente;
- URL web pública.

La interfaz mostrará una cola de fuentes con, al menos:

- nombre o título;
- tipo;
- tamaño cuando corresponda;
- idioma detectado;
- estado de extracción;
- mensaje de error cuando corresponda.

### 7.3 Formatos de entrada

El MVP incluirá soporte para los siguientes formatos:

| Formato | Extensión o fuente | Alcance del soporte |
|---|---|---|
| Texto plano | `.txt` o texto pegado | Lectura completa del texto |
| Markdown | `.md`, `.markdown` | Conservación de jerarquía textual básica |
| JSON | `.json` | Lectura, validación sintáctica y representación legible |
| PDF | `.pdf` | Extracción de texto embebido |
| Microsoft Word | `.docx` | Extracción de párrafos, encabezados y tablas básicas |
| Microsoft PowerPoint | `.pptx` | Extracción ordenada de títulos, texto y notas disponibles |
| HTML local | `.html`, `.htm` | Extracción del contenido principal |
| Página web pública | URL HTTP/HTTPS | Descarga y extracción del contenido principal |
| CSV | `.csv` | Lectura de encabezados y filas como contenido tabular |

#### Limitaciones de extracción

- Los PDF escaneados sin texto embebido no serán procesados mediante OCR.
- Las imágenes contenidas en documentos no serán interpretadas visualmente.
- Los diagramas complejos de PowerPoint no serán reconstruidos ni interpretados visualmente.
- Las fórmulas, macros y comportamiento interactivo no serán ejecutados.
- Los archivos protegidos por contraseña no serán soportados.
- Un formato no soportado deberá rechazarse con un mensaje explícito.
- Una extracción vacía no deberá considerarse exitosa.

### 7.4 Fuentes web

El usuario podrá ingresar una URL pública para generar un resumen o mapa de conocimiento.

El sistema deberá:

- validar la URL;
- descargar el contenido accesible;
- detectar el tipo de contenido;
- extraer el contenido principal cuando sea HTML;
- procesar archivos compatibles enlazados directamente, como PDF;
- registrar la URL original y la fecha de recuperación;
- guardar una copia local del contenido recuperado o normalizado.

El MVP no soportará:

- páginas que requieran autenticación;
- contenido privado de Notion, Google Drive u otros servicios;
- paywalls;
- automatización de navegador;
- sitios que requieran interacción compleja;
- video o audio de plataformas externas;
- mecanismos destinados a evadir restricciones de acceso.

### 7.5 Normalización documental

Cada fuente compatible se transformará en un documento normalizado independiente del formato original.

El documento normalizado deberá conservar, cuando estén disponibles:

- título;
- contenido textual;
- encabezados o secciones;
- metadatos básicos;
- ubicación o URL de origen;
- tipo MIME;
- idioma detectado;
- fecha de incorporación;
- advertencias de extracción.

Los workflows deberán consumir documentos normalizados y no archivos específicos.

### 7.6 Idioma

El sistema deberá diferenciar entre:

- idioma detectado de cada fuente;
- idioma de la interfaz;
- idioma solicitado para el artefacto de salida.

El MVP deberá:

- detectar automáticamente el idioma predominante de cada documento;
- mostrar el idioma detectado al usuario;
- permitir seleccionar el idioma de salida;
- generar el resultado en el idioma seleccionado;
- conservar terminología técnica cuando su traducción reduzca precisión;
- soportar fuentes con idiomas diferentes dentro de una misma ejecución.

La detección automática será una ayuda operativa y no una traducción automática de la fuente original.

### 7.7 Workflows

El MVP incluirá exclusivamente los siguientes workflows.

#### `summary`

Generará un resumen estructurado a partir de una o varias fuentes seleccionadas.

Deberá soportar:

- resumen individual de una fuente;
- resumen consolidado de varias fuentes;
- identificación de conceptos principales;
- organización jerárquica del resultado;
- salida en el idioma solicitado;
- generación de metadatos del artefacto.

La estructura exacta del resumen será definida por la especificación versionada del workflow.

#### `knowledge-map`

Generará una representación estructurada de conceptos y relaciones a partir de una o varias fuentes.

El resultado neutral deberá incluir, al menos:

- título;
- nodos;
- tipo o función de cada nodo;
- relaciones entre nodos;
- etiquetas de relaciones;
- referencia a las fuentes utilizadas.

La distribución visual específica será responsabilidad del renderizador de destino.

No se incorporarán workflows adicionales durante el MVP sin modificar formalmente este documento.

### 7.8 Proveedores de inteligencia artificial

El sistema permitirá seleccionar un proveedor y modelo configurado.

El MVP deberá incluir al menos dos adaptadores de proveedor para demostrar que los workflows no dependen de una implementación concreta.

Los proveedores deberán cumplir un contrato común para:

- recibir instrucciones y contenido normalizado;
- solicitar salidas estructuradas cuando el modelo lo permita;
- devolver resultado, uso reportado y errores normalizados;
- aplicar límites de tiempo y cancelación;
- evitar que las credenciales formen parte del workflow.

Las credenciales se configurarán localmente y nunca se almacenarán en el repositorio Git.

### 7.9 Artefactos neutrales

Todo workflow producirá primero un artefacto neutral validado mediante un esquema versionado.

El artefacto neutral deberá ser suficiente para:

- revisar el resultado sin depender de un gestor de notas;
- regenerar diferentes formatos de salida;
- conservar trazabilidad hacia las fuentes;
- evitar una nueva llamada al modelo cuando solo cambie el destino de renderizado.

Los tipos neutrales iniciales serán:

- `StudySummary`;
- `KnowledgeGraph`.

### 7.10 Destinos y renderizadores

El MVP incluirá los siguientes destinos:

#### Genérico

- Markdown;
- JSON;
- Mermaid cuando corresponda.

#### Notion

- Markdown preparado para importación o uso en Notion;
- Mermaid para mapas de conocimiento cuando corresponda;
- manifiesto de archivos y recursos generados.

#### Obsidian

- Markdown compatible con Obsidian;
- JSON Canvas para mapas de conocimiento;
- enlaces y adjuntos resueltos por el renderizador de Obsidian.

Notion y Obsidian serán destinos de renderizado, no dependencias del dominio.

### 7.11 Estructura estandarizada de carpetas

Cada proyecto seguirá una estructura determinista equivalente a:

```text
project/
├── project.json
├── sources/
│   ├── files/
│   ├── web/
│   └── pasted/
├── normalized/
├── runs/
├── artifacts/
│   ├── neutral/
│   │   ├── summaries/
│   │   └── knowledge-graphs/
│   ├── notion/
│   │   ├── pages/
│   │   └── assets/
│   ├── obsidian/
│   │   ├── notes/
│   │   ├── canvas/
│   │   └── attachments/
│   └── generic/
│       ├── markdown/
│       ├── json/
│       └── mermaid/
└── logs/
```

Reglas obligatorias:

1. Los artefactos neutrales se guardarán bajo `artifacts/neutral`.
2. Las salidas destinadas a Notion se guardarán bajo `artifacts/notion`.
3. Las salidas destinadas a Obsidian se guardarán bajo `artifacts/obsidian`.
4. Las salidas no asociadas a un gestor se guardarán bajo `artifacts/generic`.
5. El workflow no definirá rutas físicas de Notion u Obsidian.
6. La estructura podrá extenderse mediante versiones posteriores sin romper proyectos existentes.

### 7.12 Ejecuciones e historial

Cada ejecución deberá registrar:

- identificador;
- workflow y versión;
- fuentes seleccionadas;
- idioma de salida;
- proveedor y modelo;
- configuración relevante;
- destinos solicitados;
- fecha de inicio y finalización;
- estado global;
- estado individual por fuente;
- errores y advertencias;
- artefactos generados.

Estados mínimos:

- `pending`;
- `extracting`;
- `ready`;
- `processing`;
- `rendering`;
- `completed`;
- `completed_with_errors`;
- `failed`;
- `cancelled`.

El usuario podrá consultar ejecuciones anteriores y abrir sus artefactos.

### 7.13 Interfaz gráfica

El MVP contará con una interfaz de escritorio inspirada en la experiencia operativa de OpenCode, sin intentar replicar el producto completo.

La interfaz deberá incluir:

- navegación lateral de proyectos, fuentes e historial;
- panel principal de configuración y ejecución;
- dropzone para archivos;
- formulario para URL y texto pegado;
- selectores de workflow, proveedor, modelo, idioma y destino;
- consola o panel de eventos de la ejecución;
- vista previa del artefacto generado;
- barra de estado;
- mensajes de error accionables;
- soporte básico de teclado.

El sistema deberá priorizar densidad informativa, claridad y retroalimentación inmediata sobre ornamentación visual.

### 7.14 Cancelación y manejo de errores

El usuario podrá cancelar una ejecución activa cuando el proveedor o la operación lo permita.

El sistema deberá:

- aislar errores por fuente;
- continuar con las fuentes válidas cuando sea posible;
- distinguir errores de lectura, parsing, red, validación, proveedor y renderizado;
- mostrar mensajes comprensibles;
- conservar detalles técnicos en los logs locales;
- evitar artefactos marcados como exitosos cuando estén incompletos o inválidos.

## 8. Requisitos no funcionales

### 8.1 Plataforma

- El sistema se distribuirá inicialmente como aplicación de escritorio para Windows 10 y Windows 11.
- La arquitectura no deberá impedir soporte futuro para macOS o Linux.
- El empaquetado y validación oficial para macOS y Linux quedan fuera del MVP.

### 8.2 Privacidad

- No se enviará contenido a servicios distintos del proveedor seleccionado por el usuario.
- No habrá telemetría remota obligatoria.
- Las fuentes, resultados e historial permanecerán localmente.
- El usuario deberá conocer qué proveedor procesará el contenido antes de ejecutar el workflow.

### 8.3 Seguridad

- Las credenciales no deberán escribirse en archivos versionados.
- Los secretos deberán almacenarse mediante un mecanismo local apropiado.
- El acceso al sistema de archivos se limitará a ubicaciones autorizadas por el usuario.
- El contenido web se tratará como entrada no confiable.
- Los archivos importados no deberán ejecutar macros ni código embebido.

### 8.4 Rendimiento

El MVP deberá mantener la interfaz responsiva durante:

- extracción de documentos;
- descarga de contenido web;
- llamadas a proveedores;
- renderizado y escritura de artefactos.

Las operaciones pesadas no deberán bloquear el hilo de la interfaz.

Los límites de tamaño, cantidad de fuentes y contexto deberán ser configurables y producir mensajes explícitos cuando se excedan.

### 8.5 Trazabilidad

Cada artefacto deberá poder relacionarse con:

- su ejecución;
- sus fuentes;
- el workflow y versión utilizados;
- el proveedor y modelo empleados;
- el idioma de salida;
- la fecha de generación.

### 8.6 Mantenibilidad

- Los contratos principales deberán contar con pruebas automatizadas.
- Los parsers, proveedores y renderizadores deberán probarse mediante contratos comunes.
- Las decisiones arquitectónicas relevantes deberán registrarse mediante ADR.
- La lógica de dominio no deberá depender de frameworks de interfaz o infraestructura.

## 9. Fuera del alcance

Quedan explícitamente fuera del MVP:

- OCR para PDF o imágenes;
- interpretación visual avanzada de gráficos, diagramas o capturas;
- procesamiento de audio o video;
- transcripción multimedia;
- soporte completo para hojas de cálculo `.xlsx`;
- edición visual de JSON Canvas;
- publicación automática en Notion;
- sincronización bidireccional con Notion u Obsidian;
- autenticación OAuth con gestores de notas;
- actualización automática de páginas remotas;
- manejo de conflictos de sincronización;
- acceso a fuentes web privadas;
- automatización de navegador;
- evasión de paywalls o controles de acceso;
- indexación semántica global de la biblioteca;
- RAG sobre todos los proyectos;
- base de datos vectorial;
- chat persistente con toda la biblioteca;
- colaboración multiusuario;
- cuentas, roles y permisos organizacionales;
- aplicación móvil;
- aplicación web multiusuario;
- almacenamiento en la nube administrado por el producto;
- marketplace de plugins;
- programación automática de workflows;
- nuevos workflows distintos de `summary` y `knowledge-map`;
- personalización visual avanzada;
- soporte oficial de producción para macOS y Linux.

## 10. Criterios de aceptación

El MVP será aceptado cuando pueda demostrarse de extremo a extremo que:

1. Se puede crear y volver a abrir un proyecto local.
2. Se pueden agregar varios archivos mediante drag-and-drop.
3. Se puede agregar texto pegado y una URL web pública.
4. Los formatos declarados como compatibles se extraen o se rechazan explícitamente.
5. Cada fuente se transforma en un documento normalizado.
6. El sistema detecta y muestra el idioma de cada fuente.
7. El usuario puede seleccionar un idioma de salida diferente al idioma de origen.
8. El workflow `summary` genera un resumen individual y uno consolidado.
9. El workflow `knowledge-map` genera nodos y relaciones válidos.
10. Los workflows pueden ejecutarse mediante al menos dos proveedores sin modificar su definición.
11. Todo workflow produce primero un artefacto neutral validado.
12. Un artefacto neutral puede renderizarse para Notion, Obsidian y formato genérico.
13. Cambiar el destino no requiere volver a ejecutar el modelo.
14. Las salidas se guardan bajo las carpetas estandarizadas correspondientes.
15. La salida para Obsidian incluye Markdown y JSON Canvas cuando corresponda.
16. La salida para Notion incluye Markdown preparado y Mermaid cuando corresponda.
17. Una fuente defectuosa no cancela las fuentes válidas de la misma ejecución.
18. El historial muestra estado, configuración, errores y artefactos de cada ejecución.
19. Las credenciales no quedan registradas en Git ni en los artefactos.
20. La aplicación puede instalarse y ejecutarse en Windows 10 u 11.

## 11. Definición de terminado

El MVP se considerará terminado únicamente cuando:

- todos los criterios de aceptación estén demostrados;
- las pruebas automatizadas obligatorias estén aprobadas;
- no existan errores bloqueantes conocidos;
- la documentación rectora esté actualizada;
- las limitaciones conocidas estén documentadas;
- exista un paquete instalable para Windows;
- el repositorio pueda construirse desde un entorno limpio siguiendo el README;
- los workflows y esquemas estén versionados;
- los artefactos generados sean trazables hasta sus fuentes y ejecución.

La existencia de componentes aislados o pantallas sin flujo funcional no constituye un MVP terminado.

## 12. Gobierno del alcance

Este documento tiene precedencia sobre el plan de implementación y las decisiones de conveniencia técnica.

Para incorporar una capacidad fuera del alcance será obligatorio:

1. describir el problema que la justifica;
2. evaluar su impacto sobre el MVP;
3. decidir explícitamente si reemplaza o amplía una capacidad existente;
4. actualizar este documento;
5. registrar un ADR cuando afecte arquitectura o tecnología;
6. actualizar el plan de implementación.

No se implementarán funcionalidades futuras de forma anticipada bajo el argumento de que podrían ser útiles posteriormente.

## 13. Próximo documento

Una vez aceptado este alcance, el siguiente documento rector será:

```text
docs/architecture.md
```

Ese documento definirá los límites del sistema, módulos, dependencias permitidas, contratos principales y flujo técnico, sin modificar el alcance aquí aprobado.
