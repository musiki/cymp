# Content Sync Setup (Repos por Materia -> Platform)

Este setup permite que cada equipo docente trabaje en su repo de materia y que `musiki-platform` se actualice solo.

## 1) Configurar fuentes en platform

Editar `config/sources.manifest.json`:

- activar cada fuente con `"enabled": true`
- definir `"repo"` y `"branch"`
- mantener `"contentRoot": "content"` salvo que cambie en la materia

Estructura esperada por repo de materia:

- `content/cursos/**` para contenido con login
- `content/public/**` para contenido público

Reglas de promoción desde cursos a público:

- `visibility: public`
- `public_status: approved`
- `public_path: tema/ruta-del-articulo.md`
- `type: assignment` queda excluido del público aunque tenga flags

## 2) Workflow de platform (dispatch -> sync)

Ya está agregado en `.github/workflows/sync-content-sources.yml`.

Secrets requeridos en platform:

- `CONTENT_SOURCE_READ_TOKEN`: token con acceso de lectura a repos de materia (si son privados).

Comandos usados por el workflow:

- `npm run content:pull -- --clean`
- `npm run content:assemble`

## 3) Workflow en cada repo de materia (push -> dispatch)

Copiar `docs/templates/notify-platform-on-content-change.yml` a:

- `.github/workflows/notify-platform-on-content-change.yml`

Secret requerido en cada repo de materia:

- `PLATFORM_DISPATCH_TOKEN`: token con permiso para ejecutar `repository_dispatch` sobre el repo platform.

## Comandos locales útiles (platform)

- `npm run content:pull`
- `npm run content:assemble:dry`
- `npm run content:assemble`

`content:assemble:dry` genera `.tmp/assembled-content` y el reporte `.tmp/assemble-report.json` sin tocar `src/content`.
