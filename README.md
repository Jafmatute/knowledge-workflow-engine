# Knowledge Workflow Engine

Aplicación de escritorio local para transformar documentos y contenido web en resúmenes estructurados y mapas de conocimiento, manteniendo independencia respecto del proveedor de inteligencia artificial y del gestor de notas utilizado.

## Estado del proyecto

El proyecto se encuentra en la fase de definición y documentación del MVP.

Todavía no se ha iniciado la implementación del sistema.

## Objetivo del MVP

Validar un flujo completo que permita:

* Importar uno o varios documentos.
* obtener contenido desde una URL pública;
* detectar el idioma de cada fuente;
* generar resultados en el idioma seleccionado por el usuario;
* ejecutar workflows de resumen y mapas de conocimiento;
* producir primero artefactos neutrales;
* renderizar resultados para Notion, Obsidian y formatos genéricos;
* cambiar de proveedor de inteligencia artificial sin modificar los workflows.

## Principios fundamentales

1. El núcleo del sistema será independiente de Notion y Obsidian.
2. Los workflows serán independientes del proveedor de inteligencia artificial.
3. Todo procesamiento producirá primero un artefacto neutral.
4. Los formatos específicos serán responsabilidad de renderizadores.
5. El MVP será local-first y funcionará como una aplicación de escritorio.
6. El alcance no podrá ampliarse sin una decisión explícita.

## Documentación

La documentación rectora será construida en el siguiente orden:

1. [`docs/project-scope.md`](docs/project-scope.md)
2. [`docs/architecture.md`](docs/architecture.md)
3. [`docs/tech-stack.md`](docs/tech-stack.md)
4. [`docs/implementation-plan.md`](docs/implementation-plan.md)
5. [`AGENTS.md`](AGENTS.md)
6. [`docs/design-system.md`](docs/design-system.md)
7. Registros de decisiones arquitectónicas en [`docs/adr`](docs/adr)

## Workflows iniciales

El MVP contempla exclusivamente los siguientes workflows:

* `summary`: generación de resúmenes estructurados.
* `knowledge-map`: generación de mapas de conceptos y relaciones.

Las definiciones actuales utilizadas con Gemini y Obsidian se tomarán como material de referencia, pero se migrarán a contratos independientes del modelo y del gestor de notas.

## Desarrollo

La implementación comenzará después de aprobar:

* alcance del MVP;
* arquitectura;
* stack tecnológico;
* plan de implementación;
* reglas operativas para agentes;
* sistema de diseño inicial.

## Licencia

El proyecto todavía no tiene una licencia definida.
