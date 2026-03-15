---
title: ""
author: ""
date: ""
geometry: margin=1in
header-includes:
  - \usepackage{graphicx}
  - \usepackage{float}
  - \usepackage{xcolor}
  - \usepackage{fancyvrb}
  - \usepackage{framed}
  - \usepackage{fontspec}
  - \setmonofont[Scale=0.85]{DejaVu Sans Mono}
  - \definecolor{shadecolor}{RGB}{248,248,248}
  - \renewenvironment{Shaded}{\begin{snugshade}}{\end{snugshade}}
  - \usepackage{listings}
  - \lstset{breaklines=true,breakatwhitespace=false,basicstyle=\ttfamily\small}
colorlinks: true
---

\begin{center}
\includegraphics[width=0.6\textwidth]{logo-untdf.png}

\vspace{8em}

{\Huge \textbf{Talle de Nuevas Tecnologías}}

\vspace{3em}

{\Huge \textbf{Año cursada: 2024}}

\vspace{6em}

{\huge \textbf{UNTDF}}

\vspace{6em}

{\huge \textbf{Saizar Ezequiel}}

\end{center}

\newpage


## Índice

0. [Resumen](#resumen)
1. [Arquitectura general](#1-arquitectura-general)
2. [Funcionalidad: Catálogo de especies](#2-funcionalidad-catálogo-de-especies)
3. [Funcionalidad: Likes en tiempo real](#3-funcionalidad-likes-en-tiempo-real)
4. [Funcionalidad: Registro / Login para reportar](#4-funcionalidad-registro--login-para-reportar)
5. [Funcionalidad: Formulario de reporte de avistaje](#5-funcionalidad-formulario-de-reporte-de-avistaje)
6. [Puesta en marcha](#6-puesta-en-marcha)
7. [Configuración de Supabase](#7-configuración-de-supabase)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Estructura de carpetas](#9-estructura-de-carpetas)

\newpage

## Resumen

App móvil desarrollada en la cursada 2024 de **Taller de Nuevas Tecnologías (UNTDF)**.  
Permite explorar un catálogo de especies (animales, plantas y hongos), ver su detalle, dar likes en tiempo real y reportar avistajes desde el campo.

**Repositorios:**

| | Enlace |
|---|---|
| App (este proyecto) | <https://github.com/esaizar/tnt2024-especies-app> |
| API REST | <https://github.com/vieraleonel/tnt2024-especies-api> |



## 1. Arquitectura general

```
app/                    ← Rutas (Expo Router, basado en archivos)
  _layout.tsx           ← Layout raíz: AuthProvider + QueryClientProvider
  (tabs)/
    _layout.tsx         ← Navegación por pestañas
    index.tsx           ← Pantalla Home (listado de especies)
    report.tsx          ← Pantalla de reporte (protegida por auth)
  especie/
    [especieId].tsx     ← Pantalla de detalle de una especie

src/
  adapters/             ← Transformación de datos (de API a formato UI)
  components/           ← Componentes reutilizables
  context/              ← Contextos de React (AuthContext)
  services/             ← Lógica de negocio: llamadas a API y hooks
  theme/                ← Colores y estilos globales
  utils/                ← Utilidades (cliente Supabase)
```

La navegación usa **Expo Router** (file-based routing), lo que significa que cada archivo dentro de `app/` es automáticamente una ruta navegable.

El estado del servidor (listado de especies) se maneja con **TanStack Query**, que provee caché, revalidación automática y estados de carga/error.

\newpage

## 2. Funcionalidad: Catálogo de especies

### ¿Cómo funciona?

El Home muestra las especies en una grilla de dos columnas con su imagen y nombre científico. Se puede filtrar por reino (Animalia, Plantae, Fungi) o ver todas.

**Flujo de datos:**

```
useFilteredEspecies(reino)          ← hook en especies.hooks.ts
  └─ useEspecies(customSelect)      ← hook base con TanStack Query
       └─ getEspecies()             ← GET a EXPO_PUBLIC_API_URL/especies
            └─ preparaEspeciesParaHome()  ← adapter: filtra campos y ordena A-Z
```

**Patrón Adapter (`src/adapters/homeAdapters.ts`):**  
La API devuelve objetos `TEspecie` completos, pero la pantalla Home solo necesita `sp_id`, `nombre_cientifico`, `reino` e `imagen`. El adapter extrae esos campos y ordena el resultado alfabéticamente, desacoplando el modelo de la API del modelo de la UI.

**TanStack Query (`src/services/especies.hooks.ts`):**  
La configuración `staleTime: 5000` e `initialDataUpdatedAt` evitan llamadas innecesarias a la API: los datos se consideran frescos durante 5 segundos. El hook `useEspecies` acepta un `customSelect` (selector), lo que permite que `useFilteredEspecies`, `useEspeciesHome` y `useEspecie` reutilicen la misma query con transformaciones distintas.

\newpage

## 3. Funcionalidad: Likes en tiempo real

### ¿Qué hace?

En la pantalla de detalle de cada especie hay un contador de likes. Al presionar el corazón, el contador incrementa. El cambio se refleja **en tiempo real** en todos los dispositivos que tengan esa pantalla abierta, sin necesidad de recargar.

### ¿Cómo se implementó?

Se usó **Supabase Realtime** con la funcionalidad de `postgres_changes`, que permite suscribirse a cambios en una tabla de PostgreSQL y recibir los nuevos valores instantáneamente vía WebSocket.

**Archivo relevante:** `src/components/EspecieHeader.tsx`

**1. Carga inicial de likes:**  
Al montar el componente, un `useEffect` consulta la tabla `especieslikes` filtrando por `sp_id` de la especie actual y guarda el valor en el estado local `likes`.

```tsx
useEffect(() => {
  const fetchLikes = async () => {
    const { data } = await supabase
      .from('especieslikes')
      .select('like')
      .eq('sp_id', especie.sp_id);
    if (data) setLikes(data[0].like);
  };
  fetchLikes();
}, []);
```

**2. Suscripción a cambios en tiempo real:**  
Se crea un canal Supabase que escucha cualquier evento (`INSERT`, `UPDATE`, `DELETE`) sobre la tabla `especieslikes`. Cuando se recibe un evento, la función `handleInserts` actualiza el estado local con el nuevo valor.

```tsx
supabase
  .channel('especieslikes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'especieslikes' }, handleInserts)
  .subscribe();

const handleInserts = (payload) => {
  setLikes(payload.new.like);
};
```

**3. Acción de dar like:**  
Al presionar el botón:
- Si no existe registro para esa especie → hace un `INSERT` con `like: 1`.
- Si ya existe → hace un `UPDATE` incrementando el valor actual.

El componente no necesita volver a consultar la base de datos para actualizar la UI: la actualización llega automáticamente por el canal de Realtime.

\newpage

## 4. Funcionalidad: Registro / Login para reportar

### ¿Qué hace?

- **Sin sesión:** en el Home se muestra `Hola Anónimo`. Al ir a la pestaña de reportar, en lugar del formulario aparece una pantalla de login/registro.
- **Con sesión:** en el Home se muestra `Hola [nombre o email]` y aparece un botón de cerrar sesión. La pestaña de reportar muestra el formulario completo.

### ¿Cómo se implementó?

Se creó un **contexto de React** (`src/context/auth.context.tsx`) que encapsula toda la lógica de autenticación con Supabase Auth.

**`AuthProvider`:**  
Envuelve toda la aplicación desde `app/_layout.tsx`. Al iniciar, consulta si hay una sesión activa guardada (gracias a `AsyncStorage` como storage del cliente Supabase). Luego se suscribe a `onAuthStateChange` para reaccionar a login, logout y cambios de token automáticamente.

```tsx
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
});

supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session);
});
```

**Hook `useAuth`:**  
Cualquier componente accede al estado de autenticación sin necesidad de prop-drilling:
```tsx
const { user, signOut } = useAuth();
```

**Componente `AuthForm` (`src/components/AuthForm.tsx`):**  
Formulario con toggle entre modo *login* y *registro*. Usa:
- `supabase.auth.signInWithPassword({ email, password })` para login.
- `supabase.auth.signUp({ email, password })` para registro.

**Guard en `report.tsx`:**  
La pantalla de reporte simplemente condiciona su contenido con `!user`:
```tsx
{!user ? <AuthForm /> : <ScrollView>...formulario...</ScrollView>}
```
No hay redirecciones ni rutas protegidas adicionales; el guard vive dentro de la pantalla.

**Saludo y logout en `index.tsx`:**  
Se obtiene `user` del contexto. El nombre a mostrar se resuelve así:
```tsx
const displayName = user
  ? user.user_metadata?.full_name || user.email || "Usuario"
  : "Anónimo";
```
El botón de logout llama a `signOut()` del contexto, que internamente ejecuta `supabase.auth.signOut()`. Al cerrar sesión, `onAuthStateChange` dispara con `session = null`, actualizando toda la UI automáticamente.

\newpage

## 5. Funcionalidad: Formulario de reporte de avistaje

### ¿Qué hace?

Permite registrar un avistaje de una especie con: especie seleccionada, ubicación (mapa interactivo + campos de coordenadas), fecha, hora, descripción e imagen (desde cámara o galería).

### Componentes involucrados

| Componente | Responsabilidad |
|---|---|
| `EspecieSelector` | Picker con la lista de especies |
| `Map` | Mapa interactivo para elegir coordenadas |
| `DateTimeModalInput` | Selector de fecha/hora modal (adaptado a Android/iOS) |
| `TakePictureBtn` | Captura de foto con la cámara del dispositivo |
| `CustomTextInput` | Input de texto estilizado |
| `CustomButton` | Botón estilizado reutilizable |

### Flujo de envío

1. Se validan todos los campos antes de enviar; los campos con error se resaltan con borde rojo.
2. La imagen se convierte a **base64** con prefijo de tipo MIME (`data:image/jpeg;base64,...`).
3. Los datos se envían como `FormData` via `axios.post` al endpoint del backend.
4. Tras el envío exitoso, todos los campos se resetean.

\newpage

## 6. Puesta en marcha

### Requisitos previos

| Herramienta | Versión recomendada |
|---|---|
| Node.js | 18 o 20, no superior a 20 |
| npm | 9 o superior |
| Expo CLI | instalado globalmente (`npm install -g expo-cli`) |
| Android Studio **o** Xcode | para usar emulador/simulador |
| Expo Go (opcional) | app en el celular para probar sin compilar |

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/esaizar/tnt2024-especies-app
cd tnt2024-especies-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores reales (ver sección 7)

# 4. Iniciar la app
npm run android   # emulador Android
npm run ios       # simulador iOS
npm run web       # navegador web
```

> **Nota importante:** `EXPO_PUBLIC_API_URL` debe apuntar a la IP de la máquina que corre el backend en la red local. Si el backend corre en `localhost:3000`, desde un emulador Android hay que usar `10.0.2.2:3000` en lugar de `localhost`.

### Base de datos Supabase

Ver la sección [7. Configuración de Supabase](#7-configuración-de-supabase) para el detalle completo.

\newpage

## 7. Configuración de Supabase

El proyecto utiliza Supabase para dos funcionalidades: **autenticación de usuarios** (login/registro) y **likes en tiempo real**.

> **Nota:** Los proyectos de Supabase en el plan gratuito se pausan automáticamente si no reciben actividad durante 7 días. Si el proyecto está pausado y no se puede reactivar, hay que crear uno nuevo y seguir los pasos de esta sección.

### Paso 1 — Crear el proyecto

1. Ingresar a [supabase.com](https://supabase.com) con tu cuenta.
2. Hacer clic en **New project**.
3. Completar nombre, contraseña de la base de datos y región.
4. Esperar ~1 minuto a que el proyecto termine de inicializarse.

### Paso 2 — Crear la tabla `especieslikes`

Ir a **SQL Editor** en el dashboard y ejecutar:

```sql
-- Crear tabla de likes
create table especieslikes (
  id bigint primary key generated always as identity,
  sp_id int not null unique,
  "like" int not null default 0
);
-- Habilitar Realtime para esta tabla
alter publication supabase_realtime add table especieslikes;
```

> **Importante:** `like` es una palabra reservada en PostgreSQL, por eso se escapa con comillas dobles (`"like"`). Sin las comillas el SQL arroja un error de sintaxis.

### Paso 3 — Habilitar autenticación por Email

1. Ir a **Authentication → Providers**.
2. Verificar que **Email** esté habilitado (viene activado por defecto en proyectos nuevos).

### Paso 4 — Obtener las credenciales

1. Ir a **Project Settings → API**.
2. Copiar los valores de:
   - **Project URL** → `https://<ref>.supabase.co`
   - **anon public key** → JWT largo que empieza con `eyJ...`

### Paso 5 — Actualizar las variables de entorno

Editar `.env.local` con los valores obtenidos:

```env
EXPO_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
EXPO_PUBLIC_SUPABASE_KEY="<anon_key>"
```

> Las variables **deben** tener el prefijo `EXPO_PUBLIC_` para que Expo las inyecte en el bundle del cliente. Sin ese prefijo quedan como `undefined` en tiempo de ejecución.

El archivo `src/utils/supabase.ts` ya lee estas variables automáticamente:

```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
```

No es necesario modificar ese archivo al migrar a un nuevo proyecto.

\newpage

## 8. Variables de entorno

Crear el archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# URL base del backend REST (ajustar a la IP local donde corre el servidor)
EXPO_PUBLIC_API_URL="http://<IP_LOCAL>:3000"

# Proyecto Supabase (URL y clave anónima pública)
EXPO_PUBLIC_SUPABASE_URL="https://<proyecto>.supabase.co"
EXPO_PUBLIC_SUPABASE_KEY="<anon_key>"
```

> Las variables con prefijo `EXPO_PUBLIC_` son accesibles en el código JavaScript del cliente (`process.env.EXPO_PUBLIC_*`). Las variables sin ese prefijo solo son accesibles en el proceso de build y **no** se exponen al cliente.

\newpage

## 9. Estructura de carpetas

```
tnt2024-especies-app/
├── app/
│   ├── _layout.tsx              # Raíz: AuthProvider + QueryClientProvider + Stack
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Navegación por pestañas (Home / Reportar)
│   │   ├── index.tsx            # Home: listado con filtros y saludo de usuario
│   │   └── report.tsx           # Reporte: auth guard + formulario
│   └── especie/
│       └── [especieId].tsx      # Detalle de especie (dinámica por ID)
├── src/
│   ├── adapters/
│   │   └── homeAdapters.ts      # Transforma TEspecie[] → EspecieHome[]
│   ├── components/
│   │   ├── AuthForm.tsx         # Formulario login/registro
│   │   ├── CardEspecie.tsx      # Tarjeta de especie en la grilla
│   │   ├── CustomButton.tsx     # Botón reutilizable
│   │   ├── CustomTextInput.tsx  # Input reutilizable
│   │   ├── DateTimeModalInput.tsx
│   │   ├── EspecieDetail.tsx    # Tabla de datos de la especie
│   │   ├── EspecieHeader.tsx    # Header con imagen, likes y botón volver
│   │   ├── EspecieList.tsx      # FlatList de especies
│   │   ├── EspecieSelector.tsx  # Picker de especie para el reporte
│   │   ├── HomeFilter.tsx       # Chips de filtro por reino
│   │   ├── Map.tsx              # Mapa interactivo
│   │   ├── TakePictureBtn.tsx   # Botón de cámara
│   │   └── TextNunitoSans.tsx   # Text con fuente de la app
│   ├── context/
│   │   └── auth.context.tsx     # AuthProvider y hook useAuth
│   ├── services/
│   │   ├── especies.hooks.ts    # Hooks TanStack Query
│   │   └── especies.service.ts  # Llamadas a la API REST
│   ├── theme/
│   │   └── theme.ts             # Colores y estilos globales
│   └── utils/
│       └── supabase.ts          # Inicialización del cliente Supabase
├── .env.local                   # Variables de entorno (NO subir a git)
├── app.json                     # Configuración de Expo
├── babel.config.js
├── package.json
└── tsconfig.json
```
