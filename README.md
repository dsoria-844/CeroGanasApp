# 🦥 Cero Ganas
> **«¿Cero ganas hoy? ¡de pensar! pero si de comer!»**

**Cero Ganas** es una aplicación web progresiva (PWA) diseñada para eliminar la fatiga de decisión diaria a la hora de comer. Con un enfoque rápido, visual e interactivo, te ayuda a elegir qué cocinar o qué pedir por delivery en cuestión de segundos.

---

## ✨ Características Principales

### 1. 🎴 Flujo de 20 Platos al Azar & Sorteo Final
- **Navegación fluida e interactiva**: Explora tandas de 20 platos aleatorios con flechas de navegación (*Anterior / Siguiente*).
- **Decisión sin presiones**: Marca platos con **«Me interesa»** o **«Rechazar»**, con la posibilidad de volver atrás para cambiar tu elección.
- **Sorteo Inteligente**: Al alcanzar la cantidad configurada de platos favoritos (por defecto **5 platos**), se activa automáticamente un sorteo final con animación de ruleta y celebración de confeti.
- **Detalle de Recetas**: Toca cualquier tarjeta para girarla (*flip card*) y ver ingredientes, pasos de cocina o enlaces directos a apps de delivery.

### 2. ⚡ Modo «¡Tengo Hambre!» (Decisión Inmediata)
- Cuando la fatiga mental es máxima, el chef perezoso decide por ti en **3 segundos**.
- Animación de cuenta regresiva y revelación del plato ganador para cortar la parálisis de análisis.

### 3. 🥫 Despensa Inteligente (Match por Ingredientes)
- Selecciona los ingredientes que tienes en casa para descubrir recetas caseras que puedes cocinar de inmediato.
- Cálculo de porcentaje de coincidencia y sugerencias de platos listos para cocinar.
- Posibilidad de agregar ingredientes personalizados.

### 4. 🍽️ Modificar y Crear Platos (CRUD Completo)
- Administrador visual para ver, buscar y filtrar todo el catálogo de platos.
- Crea nuevos platos caseros o de delivery con tiempos, calorías, ingredientes y pasos.
- Edita o elimina platos existentes con persistencia en almacenamiento local.

### 5. 📅 Plan Semanal de Comidas
- Organiza tus almuerzos y cenas de lunes a domingo.
- Asigna platos rápidamente con un solo clic.

### 6. 🛵 Integración con Apps de Delivery
- Enlaces directos de búsqueda configurables para **PedidosYa**, **Rappi** o **Uber Eats**.

### 7. 🎨 Experiencia Visual & Accesibilidad
- Diseño adaptable para móvil (**100% Mobile Responsive**) y escritorio.
- Modo Claro / Modo Oscuro nativo con persistencia.
- Efectos de sonido sintetizados y vibración háptica.
- Fondos texturizados con la mascota oficial del chef perezoso.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador**: [Vite 6](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones**: [Motion (Framer Motion)](https://motion.dev/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Efectos**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Persistencia**: LocalStorage API con manejo seguro de estado

---

## 🚀 Instalación y Desarrollo Local

### Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- npm, pnpm o yarn

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dsoria-844/CeroGanasApp.git
   cd CeroGanasApp
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

4. **Verificar tipado y linting:**
   ```bash
   npm run lint
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```

6. **Previsualizar la compilación de producción:**
   ```bash
   npm run preview
   ```

---

## 📁 Estructura del Proyecto

```
QComo/
├── public/                 # Favicons, logos e ilustraciones de la mascota
├── src/
│   ├── components/         # Componentes modulares de vistas y modales
│   │   ├── BlindModeModal.tsx      # Modal de decisión inmediata (¡Tengo Hambre!)
│   │   ├── CookMode.tsx            # Despensa inteligente
│   │   ├── CreateMealView.tsx      # Gestor y CRUD de platos
│   │   ├── DecideTodayView.tsx     # Vista principal de 20 platos y sorteo
│   │   ├── FavoritesModal.tsx      # Modal y vista de favoritos
│   │   ├── Header.tsx              # Encabezado principal y navegación rápida
│   │   ├── HistoryView.tsx         # Historial de comidas aceptadas
│   │   ├── RecipeQuickModal.tsx    # Modal de detalle de recetas
│   │   ├── SettingsView.tsx        # Configuración de sorteo, delivery y tema
│   │   ├── Sidebar.tsx             # Menú lateral de navegación
│   │   └── WeeklyPlanView.tsx      # Planificador semanal de comidas
│   ├── utils/              # Audio sintetizado, hápticos, almacenamiento local
│   ├── types.ts            # Definición centralizada de tipos TypeScript
│   ├── App.tsx             # Componente raíz y orquestación de pestañas
│   └── main.tsx            # Punto de entrada de la aplicación
├── index.html              # Plantilla HTML con soporte PWA y tipografías
└── package.json
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
