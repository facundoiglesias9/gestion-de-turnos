# Configuración de Supabase para Gestión de Turnos

## Pasos para configurar la base de datos

### 1. Crear las tablas en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/pktgxbnpwtiwdkngvlhd
2. Haz clic en el ícono de **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega todo el contenido del archivo `supabase-schema.sql`
5. Haz clic en **Run** para ejecutar el script

Esto creará:
- La tabla `turns` con todos los campos necesarios
- Índices para mejorar el rendimiento
- Políticas de Row Level Security (RLS) para que cada usuario solo vea sus propios turnos
- Triggers para actualizar automáticamente el campo `updated_at`

### 2. Configurar la autenticación

1. Ve a **Authentication** > **Providers** en el panel de Supabase
2. Asegúrate de que **Email** esté habilitado
3. En **Email Templates**, puedes personalizar los emails de confirmación si lo deseas
4. Para desarrollo, puedes desactivar la confirmación de email:
   - Ve a **Authentication** > **Settings**
   - Desactiva "Enable email confirmations" (solo para desarrollo)

### 3. Variables de entorno

El archivo `.env.local` ya está creado con tus credenciales:

```
NEXT_PUBLIC_SUPABASE_URL=https://pktgxbnpwtiwdkngvlhd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE**: Nunca subas el archivo `.env.local` a Git. Ya está incluido en `.gitignore`.

### 4. Reiniciar el servidor de desarrollo

Después de crear las tablas, reinicia el servidor:

```bash
# Detén el servidor actual (Ctrl+C)
npm run dev
```

## Funcionalidades implementadas

✅ **Autenticación con Supabase Auth**
- Registro de usuarios con email y contraseña
- Login con email y contraseña
- Logout
- Persistencia de sesión automática
- Metadata de usuario (business_name)

✅ **Gestión de turnos con Supabase Database**
- Crear turnos (se guardan en la nube)
- Ver turnos del usuario actual
- Marcar turnos como completados/no completados
- Eliminar turnos
- Ordenamiento por fecha

✅ **Seguridad**
- Row Level Security (RLS) habilitado
- Cada usuario solo puede ver y modificar sus propios turnos
- Políticas de seguridad a nivel de base de datos

## Próximos pasos sugeridos

1. **Desactivar confirmación de email** (para desarrollo):
   - Authentication > Settings > Disable email confirmations

2. **Crear tu primer usuario**:
   - Ve a http://localhost:3015/login
   - Haz clic en "¿No tienes cuenta? Regístrate aquí"
   - Completa el formulario con tu email, contraseña y nombre del negocio

3. **Verificar que funciona**:
   - Crea algunos turnos
   - Cierra sesión y vuelve a iniciar
   - Los turnos deberían seguir ahí (guardados en Supabase)

## Troubleshooting

### Error al crear turnos
- Verifica que ejecutaste el script SQL completo
- Revisa la consola del navegador para ver el error específico
- Ve a **Table Editor** en Supabase y verifica que la tabla `turns` existe

### Error de autenticación
- Verifica que las variables de entorno estén correctas
- Reinicia el servidor después de crear `.env.local`
- Verifica que Email Auth esté habilitado en Supabase

### Los turnos no se guardan
- Abre las DevTools del navegador (F12)
- Ve a la pestaña Console
- Busca errores relacionados con Supabase
- Verifica que las políticas RLS estén creadas correctamente
