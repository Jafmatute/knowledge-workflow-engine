# Política de seguridad

## Estado del proyecto

Knowledge Workflow Engine se encuentra en desarrollo inicial y todavía no tiene una versión pública soportada.

No debe utilizarse para procesar información sensible en entornos de producción.

## Versiones soportadas

| Versión | Soporte |
|---|---|
| Rama `main` | Correcciones de seguridad durante el desarrollo |
| Releases publicadas | No existen todavía |

Esta tabla se actualizará cuando exista una primera release.

## Reportar una vulnerabilidad

No publique información sensible de una vulnerabilidad en un issue, discusión o pull request público.

Utilice, en este orden:

1. La opción **Report a vulnerability** o **Security Advisories** del repositorio, cuando esté disponible.
2. Si no existe un canal privado habilitado, abra un issue público sin detalles técnicos sensibles y solicite un canal privado de comunicación.

Incluya de forma privada:

- descripción;
- versión, commit o rama afectada;
- pasos mínimos para reproducir;
- impacto;
- condiciones necesarias;
- evidencia no sensible;
- mitigación sugerida, si existe.

No incluya:

- API keys;
- credenciales;
- documentos de usuario;
- datos personales;
- logs completos sin redactar;
- tokens;
- respuestas privadas de proveedores.

## Alcance prioritario

Se consideran especialmente relevantes:

- acceso no autorizado al filesystem;
- escape de rutas autorizadas;
- exposición de secretos;
- IPC no validado;
- ejecución de código desde documentos;
- carga de contenido remoto en el renderer;
- SSRF;
- redirecciones hacia redes privadas;
- inyección de contenido en previews;
- prompt injection que obtenga archivos o secretos;
- escritura fuera del workspace;
- artefactos marcados como válidos sin validación;
- logs que revelen contenido o credenciales;
- dependencias comprometidas.

## Expectativas de respuesta

Durante el desarrollo inicial, los mantenedores procurarán:

- confirmar recepción;
- reproducir el problema;
- evaluar severidad;
- definir una mitigación;
- preparar una corrección;
- comunicar cuándo sea seguro divulgar detalles.

No se garantiza un SLA mientras no exista una release soportada.

## Divulgación coordinada

Solicitamos no divulgar públicamente detalles explotables hasta que:

- exista una corrección o mitigación;
- los mantenedores hayan confirmado la resolución;
- se haya acordado una fecha razonable de divulgación.

## Investigación segura

Durante pruebas de seguridad:

- utilice datos propios o fixtures;
- no acceda a sistemas de terceros;
- no degrade servicios;
- no realice ingeniería social;
- no extraiga información ajena;
- no genere costes significativos en proveedores;
- no publique secretos encontrados accidentalmente.

## Manejo de secretos

Las credenciales de proveedores deben:

- almacenarse mediante el mecanismo seguro aprobado;
- permanecer fuera del renderer;
- permanecer fuera de SQLite sin protección;
- permanecer fuera de logs, manifiestos y artefactos;
- rotarse inmediatamente si se exponen.

## Dependencias

Los cambios de dependencias deben revisar:

- mantenimiento;
- procedencia;
- licencia;
- vulnerabilidades conocidas;
- compatibilidad con Electron;
- impacto en el paquete final.

Las actualizaciones de seguridad no deben mezclarse con refactors no relacionados.
