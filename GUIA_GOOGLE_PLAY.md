# 📱 Guía Completa: Publicar App en Google Play

Esta guía te ayudará a convertir tu aplicación Next.js de Gestión de Turnos en una app nativa para Android y publicarla en Google Play Store.

---

## 📋 Requisitos Previos

- ✅ Cuenta de Google Play Console (ya la tenés)
- ✅ Node.js instalado
- ✅ Android Studio instalado (lo vamos a necesitar)
- ✅ Java JDK 17 o superior

---

## 🚀 Paso 1: Instalar Capacitor

### 1.1 Habilitar Scripts en PowerShell (si es necesario)

Abrí PowerShell como **Administrador** y ejecutá:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 1.2 Instalar Capacitor

En la carpeta del proyecto (`gestion-de-turnos`), ejecutá:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

### 1.3 Inicializar Capacitor

```bash
npx cap init
```

Te va a preguntar:
- **App name**: `Gestión de Turnos` (o el nombre que quieras)
- **App ID**: `com.tuempresa.turnos` (debe ser único, formato: com.empresa.app)
- **Web directory**: `out` (porque Next.js exporta a esta carpeta)

---

## 🏗️ Paso 2: Configurar Next.js para Exportación Estática

### 2.1 Modificar `next.config.ts`

Agregá la configuración de exportación estática:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

### 2.2 Construir la App

```bash
npm run build
```

Esto va a crear la carpeta `out` con tu app lista para ser empaquetada.

---

## 📱 Paso 3: Agregar Plataforma Android

### 3.1 Agregar Android

```bash
npx cap add android
```

Esto crea la carpeta `android/` con todo el proyecto nativo.

### 3.2 Copiar Assets

Cada vez que hagas cambios en tu web, ejecutá:

```bash
npm run build
npx cap copy android
npx cap sync android
```

---

## 🎨 Paso 4: Configurar Íconos y Splash Screen

### 4.1 Crear Ícono de la App

Necesitás un ícono de **1024x1024 px** en formato PNG.

Guardalo como `icon.png` en la raíz del proyecto.

### 4.2 Crear Splash Screen

Necesitás una imagen de **2732x2732 px** en formato PNG.

Guardala como `splash.png` en la raíz del proyecto.

### 4.3 Instalar Generador de Assets

```bash
npm install @capacitor/assets --save-dev
```

### 4.4 Generar Assets

```bash
npx capacitor-assets generate --android
```

Esto va a generar automáticamente todos los tamaños necesarios para Android.

---

## 🔧 Paso 5: Configurar Permisos y Metadata

### 5.1 Editar `android/app/src/main/AndroidManifest.xml`

Asegurate de que tenga estos permisos:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### 5.2 Editar `android/app/build.gradle`

Cambiá estos valores:

```gradle
android {
    namespace "com.tuempresa.turnos"  // Tu App ID
    compileSdk 34
    
    defaultConfig {
        applicationId "com.tuempresa.turnos"  // Tu App ID
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 🔐 Paso 6: Generar Keystore (Firma de la App)

### 6.1 Crear Keystore

Ejecutá en la terminal (desde cualquier carpeta):

```bash
keytool -genkey -v -keystore mi-app-key.keystore -alias mi-app -keyalg RSA -keysize 2048 -validity 10000
```

Te va a pedir:
- **Password**: Elegí una contraseña segura (¡guardala!)
- **Nombre, Organización, etc.**: Completá con tus datos

**⚠️ IMPORTANTE:** Guardá el archivo `mi-app-key.keystore` en un lugar seguro. Si lo perdés, no vas a poder actualizar tu app nunca más.

### 6.2 Configurar Firma en Android Studio

1. Abrí Android Studio
2. Abrí el proyecto: `File > Open` → Seleccioná la carpeta `android/`
3. Andá a `Build > Generate Signed Bundle / APK`
4. Seleccioná **Android App Bundle**
5. Seleccioná tu keystore y completá los datos
6. Elegí **release** como Build Variant
7. Click en **Finish**

El archivo `.aab` se va a generar en:
```
android/app/release/app-release.aab
```

---

## 📦 Paso 7: Subir a Google Play Console

### 7.1 Crear Nueva App

1. Entrá a [Google Play Console](https://play.google.com/console)
2. Click en **Crear aplicación**
3. Completá:
   - Nombre de la app
   - Idioma predeterminado
   - Tipo: App / Juego
   - Gratis / De pago

### 7.2 Completar Ficha de Play Store

Necesitás preparar:

**Textos:**
- Título (máx. 30 caracteres)
- Descripción breve (máx. 80 caracteres)
- Descripción completa (máx. 4000 caracteres)

**Gráficos:**
- Ícono de la app: 512x512 px (PNG)
- Imagen destacada: 1024x500 px (PNG/JPG)
- Capturas de pantalla: Mínimo 2, máximo 8 (formato 16:9 o 9:16)
  - Tamaño recomendado: 1080x1920 px

### 7.3 Configurar Contenido

1. **Clasificación de contenido**: Completá el cuestionario
2. **Público objetivo**: Seleccioná el rango de edad
3. **Categoría**: Elegí "Productividad" o "Negocios"
4. **Política de privacidad**: Agregá la URL de tu política (si no tenés, te puedo ayudar a crear una)

### 7.4 Subir el AAB

1. Andá a **Producción** → **Crear nueva versión**
2. Subí el archivo `app-release.aab`
3. Completá las **Notas de la versión** (qué hay de nuevo)
4. Click en **Guardar** y luego **Revisar versión**
5. Click en **Iniciar lanzamiento en producción**

---

## ⏱️ Tiempos de Revisión

- **Primera revisión**: Puede tardar hasta **7 días**
- **Actualizaciones**: Generalmente **1-3 días**

---

## 🔄 Actualizaciones Futuras

Cada vez que quieras actualizar la app:

1. Hacé cambios en tu código
2. Incrementá `versionCode` y `versionName` en `build.gradle`
3. Ejecutá:
   ```bash
   npm run build
   npx cap copy android
   npx cap sync android
   ```
4. Generá nuevo AAB firmado en Android Studio
5. Subí a Google Play Console

---

## 🆘 Problemas Comunes

### Error: "App not configured for billing"
- Completá toda la información de la app en Play Console
- Configurá una cuenta de comerciante si vas a cobrar

### Error: "Upload failed"
- Asegurate de que el `versionCode` sea mayor al anterior
- Verificá que el AAB esté firmado correctamente

### La app no se instala
- Verificá que `minSdk` sea compatible con tu dispositivo
- Asegurate de haber habilitado "Instalar apps de origen desconocido"

---

## 📞 Soporte

Si tenés algún problema, avisame y te ayudo a resolverlo.

¡Éxitos con tu app! 🚀
