# 🚀 Quick Start - Deploy to Vercel

## Paso 1: Setup Turso Database (5 minutos)

```bash
# Ejecuta el script automatizado
bash scripts/setup-turso.sh
```

Este script te guiará para:
- ✅ Instalar Turso CLI
- ✅ Crear tu cuenta
- ✅ Crear la base de datos
- ✅ Generar el token de acceso

**IMPORTANTE:** Copia y guarda el URL y Token que aparecen al final.

## Paso 2: Configurar Vercel (3 minutos)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables:

```
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
AUTH_SECRET=tu-secret-de-32-chars
BETTER_AUTH_URL=https://tu-dominio.vercel.app

ASTRO_DB_REMOTE_URL=libsql://cymp-production-xxx.turso.io
ASTRO_STUDIO_APP_TOKEN=tu-token-de-turso
```

## Paso 3: Push Schema a Turso

```bash
# Configurar las variables localmente primero
export ASTRO_DB_REMOTE_URL="tu-url-de-turso"
export ASTRO_STUDIO_APP_TOKEN="tu-token"

# Push schema
astro db push --remote
```

## Paso 4: Deploy! 🎉

```bash
# Push a GitHub
git add .
git commit -m "Ready for production"
git push

# Vercel detectará el cambio y deployará automáticamente
```

## Verificar Deployment

1. Ve a tu URL de Vercel
2. Haz login con Google
3. Inscríbete a un curso
4. Verifica que las submissions se guarden

## Troubleshooting

### Error: "database is locked"
- Es normal en desarrollo local
- No afecta producción

### Error: "ASTRO_DB_REMOTE_URL not found"
- Verifica que las variables estén en Vercel
- Redeploya desde Vercel dashboard

### Error después de deploy
- Verifica los logs en Vercel
- Confirma que todas las env variables estén configuradas

## Mantener la DB

```bash
# Ver datos en producción
turso db shell cymp-production

# Backup
turso db dump cymp-production > backup.sql

# Ver estadísticas
turso db show cymp-production
```

## 💰 Costos

**TODO GRATIS** con Turso Free Tier:
- 9 GB storage
- 1 billion row reads/month
- Suficiente para ~1000 estudiantes activos

---

¿Problemas? Revisa `DEPLOYMENT.md` para más detalles.
