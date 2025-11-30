# 🚀 Configuración de Supabase - Guía Rápida

Esta guía te ayudará a configurar Supabase para SmartPresence AI en **5 minutos**.

---

## 📋 Paso 1: Crear Proyecto en Supabase

1. **Ve a** [supabase.com](https://supabase.com)
2. **Clic en** "Start your project" o "New Project"
3. **Regístrate** con GitHub (recomendado) o Google
4. **Crea un nuevo proyecto:**
   - **Name:** `smartpresence-dev` (o el nombre que prefieras)
   - **Database Password:** Genera una contraseña segura (¡guárdala!)
   - **Region:** Selecciona la más cercana (ej: South America - São Paulo)
   - **Pricing Plan:** Free (suficiente para desarrollo)
5. **Clic en** "Create new project"
6. **Espera** 1-2 minutos mientras se crea

---

## 📋 Paso 2: Obtener Connection String

1. En el dashboard de Supabase, ve a **Settings** (⚙️ en la barra lateral)
2. Clic en **Database**
3. Busca la sección **"Connection string"**
4. Selecciona el tab **"URI"**
5. **Copia** el connection string que se ve así:

```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

6. **IMPORTANTE:** Reemplaza `[YOUR-PASSWORD]` con la contraseña que creaste en el Paso 1

---

## 📋 Paso 3: Configurar .env.development

1. **Abre** el archivo `.env.development`
2. **Reemplaza** la línea `DATABASE_URL` con tu connection string de Supabase
3. **Agrega** `?sslmode=require` al final

**Ejemplo:**
```env
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:tu_password_aqui@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 📋 Paso 4: Ejecutar Migraciones

Ahora que tienes Supabase configurado, ejecuta estos comandos:

```bash
# 1. Generar las migraciones iniciales
npm run migration:generate -- -n InitialSchema

# 2. Ejecutar las migraciones (crear las tablas en Supabase)
npm run migration:run

# 3. (Opcional) Cargar datos de prueba
npm run seed

# 4. Iniciar el servidor
npm run start:dev
```

---

## 📋 Paso 5: Verificar en Supabase

1. **Ve a** tu proyecto en Supabase
2. **Clic en** "Table Editor" en la barra lateral
3. **Deberías ver** todas las tablas creadas:
   - ✅ `institutions`
   - ✅ `campuses`
   - ✅ `devices`
   - ✅ `classrooms`
   - ✅ `students`
   - ✅ `teachers`
   - ✅ `courses`
   - ✅ `groups`
   - ✅ `enrollments`
   - ✅ `teaching_assignments`
   - ✅ `class_sessions`
   - ✅ `attendance_snapshots`
   - ✅ `attendance_records`
   - ✅ `integrations`
   - ✅ `integration_mappings`
   - ✅ `users`

---

## ✅ ¡Listo! Ahora puedes:

1. **Iniciar el servidor:** `npm run start:dev`
2. **Abrir Swagger:** http://localhost:3000/api/docs
3. **Probar endpoints** en Swagger
4. **Ver datos** en Supabase Table Editor

---

## 🔒 Seguridad

### Para Desarrollo
- ✅ Está bien usar la contraseña directamente en `.env.development`
- ⚠️ **NUNCA** commitear archivos `.env` a Git (ya está en `.gitignore`)

### Para Producción
1. **Crear un proyecto SEPARADO** en Supabase para producción
2. **Cambiar la contraseña** de la base de datos
3. **Usar variables de entorno** del servicio de hosting (Railway, Render, etc.)
4. **Generar nuevos JWT secrets** con:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## 🆘 Troubleshooting

### Error: "Connection timeout"
**Solución:** Verifica que el connection string sea correcto y que incluya `?sslmode=require`

### Error: "password authentication failed"
**Solución:** 
1. Ve a Supabase → Settings → Database
2. Clic en "Reset database password"
3. Actualiza tu `.env.development` con la nueva contraseña

### Error: "SSL connection required"
**Solución:** Agrega `?sslmode=require` al final de tu `DATABASE_URL`

---

## 📚 Próximos Pasos

Una vez que Supabase esté funcionando:

1. ✅ Ejecutar migraciones: `npm run migration:run`
2. ✅ Cargar datos de prueba: `npm run seed`
3. ✅ Iniciar servidor: `npm run start:dev`
4. ✅ Probar API: http://localhost:3000/api/docs
5. ✅ **LISTO PARA PASAR A CURSOR** 🎨

---

**¿Problemas?** Revisa la [documentación de Supabase](https://supabase.com/docs/guides/database) o abre un issue en el repositorio.
