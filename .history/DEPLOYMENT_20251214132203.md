# Deployment Guide - Vercel

## Problema Actual
Astro DB requiere configuración para producción. El error indica que necesitas conectar a una base de datos remota.

## Solución: Usar Turso (libSQL)

### 1. Crear cuenta en Turso (GRATIS)
```bash
# Instalar Turso CLI
brew install tursodatabase/tap/turso

# Login
turso auth signup
```

### 2. Crear base de datos
```bash
# Crear DB
turso db create cymp-production

# Obtener URL de conexión
turso db show cymp-production

# Crear token de autenticación
turso db tokens create cymproduction
```

### 3. Configurar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```
ASTRO_STUDIO_APP_TOKEN=<tu-token-de-turso>
ASTRO_DB_REMOTE_URL=<url-de-turso>
```

### 4. Actualizar package.json

Agrega el script de build con flag `--remote`:

```json
{
  "scripts": {
    "build": "astro build --remote",
    "build:local": "astro build"
  }
}
```

### 5. Push DB Schema a Turso
```bash
# Push tu schema a la DB remota
astro db push --remote
```

## Alternativa: SQLite File (Desarrollo/Testing)

Si solo quieres testear sin base de datos remota:

### En Vercel Environment Variables:
```
ASTRO_DATABASE_FILE=/tmp/db.sqlite
```

⚠️ **NOTA**: Esta opción NO es persistente en Vercel (se borra en cada deploy)

## Variables de Entorno Necesarias

Tu archivo `.env` debe tener:

```env
# Google OAuth (ya lo tienes)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
AUTH_SECRET="..."
BETTER_AUTH_URL="https://tu-dominio.vercel.app"

# Astro DB - Producción (Turso)
ASTRO_STUDIO_APP_TOKEN="tu-token"
ASTRO_DB_REMOTE_URL="libsql://cymp-production-xxx.turso.io"
```

## Comandos Útiles

```bash
# Build local (development)
npm run build:local

# Build para Vercel (con remote DB)
npm run build

# Push schema changes a producción
astro db push --remote

# Ver contenido de DB remota
turso db shell cymp-production
```

## Checklist Pre-Deployment

- [ ] Cuenta Turso creada
- [ ] Base de datos creada en Turso
- [ ] Token generado
- [ ] Variables de entorno configuradas en Vercel
- [ ] Script de build actualizado en package.json
- [ ] Schema pushed a Turso
- [ ] Seed ejecutado en DB remota (si es necesario)

## Costos

- ✅ **Turso FREE tier**: 
  - 9GB almacenamiento
  - 1 billón de row reads
  - Perfecto para empezar

## Más Info

- [Astro DB Docs](https://docs.astro.build/en/guides/astro-db/)
- [Turso Docs](https://docs.turso.tech/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
