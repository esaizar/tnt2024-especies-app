# EspeciesApp — Documentación técnica

App móvil desarrollada en la cursada 2024 de **Taller de Nuevas Tecnologías (UNTDF)**.  
Permite explorar un catálogo de especies (animales, plantas y hongos), ver su detalle, dar likes en tiempo real y reportar avistajes desde el campo.

---

## Índice

1. [Puesta en marcha](#1-puesta-en-marcha)
2. [Arquitectura general](#2-arquitectura-general)
3. [Funcionalidad: Catálogo de especies](#3-funcionalidad-catálogo-de-especies)
4. [Funcionalidad: Likes en tiempo real](#4-funcionalidad-likes-en-tiempo-real)
5. [Funcionalidad: Registro / Login para reportar](#5-funcionalidad-registro--login-para-reportar)
6. [Funcionalidad: Formulario de reporte de avistaje](#6-funcionalidad-formulario-de-reporte-de-avistaje)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Estructura de carpetas](#8-estructura-de-carpetas)

---

## 1. Puesta en marcha

### Requisitos previos

| Herramienta | Versión recomendada |
|---|---|
| Node.js | 18 o superior |
| npm | 9 o superior |
| Expo CLI | instalado globalmente (`npm install -g expo-cli`) |
| Android Studio **o** Xcode | para usar emulador/simulador |
| Expo Go (opcional) | app en el celular para probar sin compilar |

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd tnt2024-especies-app-main-01-06

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

El proyecto usa un proyecto Supabase compartido de cátedra. Para usar uno propio:

1. Crear una cuenta en [supabase.com](https://supabase.com) y crear un nuevo proyecto.
2. Crear las tablas necesarias (ver abajo).
3. Actualizar `SUPABASE_URL` y `SUPABASE_KEY` en `.env.local` y también en `src/utils/supabase.ts`.

**Tabla `especieslikes`** (para la funcionalidad de likes):

```sql
create table especieslikes (
  id bigint primary key generated always as identity,
  sp_id int not null unique,
  like int not null default 0
);

-- Habilitar Realtime para esta tabla
alter publication supabase_realtime add table especieslikes;
```

**Autenticación:** Activar el proveedor **Email** en Supabase Dashboard → Authentication → Providers.

---

## 2. Arquitectura general

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

---

## 3. Funcionalidad: Catálogo de especies

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

---

## 4. Funcionalidad: Likes en tiempo real

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

---

## 5. Funcionalidad: Registro / Login para reportar

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

---

## 6. Funcionalidad: Formulario de reporte de avistaje

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

---

## 7. Variables de entorno

Crear el archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# URL base del backend REST (ajustar a la IP local donde corre el servidor)
EXPO_PUBLIC_API_URL="http://<IP_LOCAL>:3000"

# Proyecto Supabase (URL y clave anónima pública)
SUPABASE_URL="https://<proyecto>.supabase.co"
SUPABASE_KEY="<anon_key>"
```

> Las variables con prefijo `EXPO_PUBLIC_` son accesibles en el código JavaScript del cliente (`process.env.EXPO_PUBLIC_*`). Las variables sin ese prefijo solo son accesibles en el proceso de build y **no** se exponen al cliente.

---

## 8. Estructura de carpetas

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
