
# 🔐 Generar AAB Firmado desde Android Studio

## Paso 1: Asegurate de que Gradle terminó de sincronizar

En Android Studio, esperá a que la barra de progreso de abajo termine (puede tardar unos minutos).

---

## Paso 2: Generar Keystore y AAB

### 2.1 Abrir el menú de Build

1. En Android Studio, andá a: **Build** → **Generate Signed Bundle / APK**
2. Seleccioná **Android App Bundle** (AAB)
3. Click en **Next**

### 2.2 Crear nuevo Keystore

1. Click en **Create new...**
2. Completá los datos:

**Key store path:**
```
C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\gestion-turnos.keystore
```

**Password:** `TurnosApp2024!` (o la que prefieras - ¡GUARDALA!)

**Alias:** `gestion-turnos`

**Alias password:** `TurnosApp2024!` (la misma)

**Validity (years):** `25`

**Certificate:**
- **First and Last Name:** Facundo
- **Organizational Unit:** Development
- **Organization:** Gestion Turnos
- **City or Locality:** (tu ciudad)
- **State or Province:** (tu provincia)
- **Country Code:** AR

3. Click en **OK**

### 2.3 Generar el AAB

1. Verificá que los datos del keystore sean correctos
2. Marcá **Remember passwords** (opcional, para no tener que escribirlas cada vez)
3. Click en **Next**
4. Seleccioná **release** como Build Variant
5. **Signature Versions:** Marcá V1 y V2
6. Click en **Finish**

---

## Paso 3: Encontrar el AAB generado

El archivo se va a generar en:
```
C:\Users\Facundo\.gemini\antigravity\scratch\gestion-de-turnos\android\app\release\app-release.aab
```

Android Studio te va a mostrar un mensaje cuando termine. Click en **locate** para abrir la carpeta.

---

## Paso 4: Verificar el AAB

El archivo `app-release.aab` es el que vas a subir a Google Play Console.

**Tamaño aproximado:** Entre 5-15 MB (dependiendo de tu app)

---

## ⚠️ MUY IMPORTANTE

**Guardá el archivo `gestion-turnos.keystore` en un lugar seguro** (Google Drive, Dropbox, etc.)

Si perdés este archivo, **NUNCA** vas a poder actualizar tu app en Google Play. Vas a tener que crear una app nueva desde cero.

---

## 🔄 Para Futuras Actualizaciones

Cada vez que quieras actualizar la app:

1. Hacé cambios en tu código
2. Incrementá el `versionCode` en `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Era 1, ahora 2
   versionName "1.1.0"  // Era "1.0.0", ahora "1.1.0"
   ```
3. Ejecutá:
   ```bash
   npm run build
   npx cap sync android
   ```
4. Generá nuevo AAB firmado (Build → Generate Signed Bundle)
5. Subí a Google Play Console

---

## 🆘 Si algo sale mal

### Error: "Gradle build failed"
- Esperá a que Gradle termine de sincronizar completamente
- Andá a **File** → **Invalidate Caches / Restart**

### Error: "Keystore was tampered with"
- Verificá que la contraseña sea correcta
- Creá un nuevo keystore

### No aparece la opción "Generate Signed Bundle"
- Asegurate de que el proyecto Android esté abierto (no el proyecto Next.js)
- Cerrá y volvé a abrir Android Studio

---

¡Avisame cuando tengas el AAB generado y te ayudo con Google Play Console! 🚀
