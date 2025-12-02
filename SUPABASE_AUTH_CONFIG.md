# Configuración adicional de Supabase Auth

## Desactivar confirmación de email (IMPORTANTE)

Para que el login funcione inmediatamente sin necesidad de confirmar email:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/pktgxbnpwtiwdkngvlhd
2. Click en **Authentication** en el menú lateral
3. Click en **Settings** (o **Configuración**)
4. Busca la sección **Email Auth**
5. **Desactiva** la opción **"Enable email confirmations"**
6. Guarda los cambios

## ¿Por qué esto es necesario?

Supabase por defecto requiere que los usuarios confirmen su email antes de poder iniciar sesión. Como estamos usando emails ficticios (usuario@tzinails.app), necesitamos desactivar esta verificación.

## Alternativa para producción

Si en el futuro querés usar emails reales y confirmación, podés:
1. Cambiar el dominio `@tzinails.app` por uno real que controles
2. Configurar un servidor SMTP en Supabase
3. Reactivar la confirmación de email

## Cómo funciona ahora

- El usuario ingresa: `tiziana`
- Internamente se convierte a: `tiziana@tzinails.app`
- Supabase guarda este email
- El usuario siempre usa solo `tiziana` para entrar
- Los datos se guardan en la nube de Supabase
- Funciona desde cualquier dispositivo
