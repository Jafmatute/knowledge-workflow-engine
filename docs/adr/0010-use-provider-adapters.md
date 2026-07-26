# ADR-0010: Usar adaptadores para proveedores de inteligencia artificial

- **Estado:** Accepted
- **Fecha:** 2026-07-24
- **Responsables:** Mantenedores del proyecto

## Contexto

El MVP debe demostrar que un workflow se ejecuta con más de un proveedor sin modificar su definición. Los SDK difieren en autenticación, modelos, schemas, errores, cancelación y uso.

## Decisión

Definir un puerto común `ModelProvider` e implementar adaptadores iniciales para Gemini mediante `@google/genai` y OpenAI mediante `openai`. Cada adaptador manejará autenticación, capacidades, transformación de schemas, timeout, cancelación, errores y uso.

## Alternativas consideradas

- **SDK directo dentro del workflow:** rechazado por acoplamiento.
- **LangChain u otro framework de orquestación:** rechazado por dependencias innecesarias.
- **Un solo proveedor:** rechazado porque no demostraría agnosticidad.

## Consecuencias

### Positivas
- proveedores intercambiables;
- pruebas de contrato comunes;
- errores coherentes;
- workflows neutrales.

### Negativas
- capacidades desiguales;
- adaptadores y mocks adicionales.

## Reglas derivadas

- No codificar modelos dentro de workflows.
- No almacenar credenciales en workflows, logs o manifiestos.
- Declarar capacidades por modelo.
- Validar localmente toda respuesta.
- Un tercer proveedor requiere actualizar alcance o plan.
