# 🏛️ Pyramid Secret Chamber

> Juego de plataformas retro de exploración de pirámides desarrollado con **Phaser 4**, **TypeScript** y **Vite**.

Inspirado en los clásicos juegos arcade de plataformas de los años 80 (como *Montezuma's Revenge* y exploradores de tumbas antiguas), el jugador explora las cámaras de una pirámide resolviendo acertijos, esquivando momias y trampas, recolectando llaves y tesoros para descender a través de los cuatro niveles de la pirámide.

---

## 🕹️ Características del Juego

- **Resolución Arcade:** 640 × 480 px nativos en formato 4:3 (rejilla de 20 × 15 baldosas de 32 × 32 px).
- **10 Recámaras Interconectadas:** Distribuidas a lo largo de 4 niveles piramidales:
  - **Nivel 1 (Cúspide):** Recámara 1.
  - **Nivel 2:** Recámaras 2 y 3.
  - **Nivel 3:** Recámaras 4, 5 y 6.
  - **Nivel 4 (Base):** Recámaras 7, 8, 9 y 10.
- **Mecánicas Clásicas de Plataformas:**
  - Desplazamiento lateral preciso sin deslizamiento involuntario.
  - Salto parabólico de altura controlada.
  - Subida y descenso por escaleras con alineación automática al eje vertical.
  - Detección de caída fatal: alturas superiores a 5.5 bloques (176 px) restan una vida al jugador.
  - Recolección de llaves de colores para abrir puertas selladas.
  - Trampas ocultas, momias guardianas y secretos.
- **Menú Inicial:**
  - *New Game*: Comienza desde la Recámara 1 con 3 vidas y 0 puntos.
  - *Continue / Chamber Selector*: Permite reanudar o elegir directamente cualquiera de las 10 recámaras con las flechas izquierda/derecha.
  - *Controls*: Visualización de controles.

---

## 🎮 Controles

| Tecla / Acción | Función |
| -------------- | ------- |
| **← / →** (Flechas Izq / Der) | Caminar hacia los lados |
| **↑** (Flecha Arriba) | Subir escaleras / Entrar por puertas desbloqueadas |
| **↓** (Flecha Abajo) | Bajar escaleras |
| **Espacio** o **↑** (en suelo) | Saltar |
| **ESC** o **M** | Pausa y volver al Menú Principal |

---

## 🛠️ Tecnologías

- **Phaser 4.0.0**
- **TypeScript 5.7+**
- **Vite 6.3+**
- **Node.js Test Runner** (`node:test`)

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v20 o superior instalado.

### Instalación de dependencias
```bash
npm install
```

### Servidor de Desarrollo
```bash
npm run dev-nolog
```
Abre tu navegador en [http://localhost:8080](http://localhost:8080) (o el puerto indicado en la consola).

### Pruebas Unitarias
El proyecto cuenta con una suite completa de pruebas unitarias sobre las reglas arcade, física cinemática del jugador y la arquitectura de las 10 recámaras:
```bash
npm test
```

### Compilación para Producción
```bash
npm run build-nolog
```
Los archivos optimizados y empaquetados se generarán en la carpeta `dist/`.

---

## 🚀 Integración Continua y Despliegue (GitHub Actions / GitLab)

El proyecto incluye pipelines automatizados tanto para **GitHub Actions** (`.github/workflows/deploy.yml`) como para **GitLab CI** (`.gitlab-ci.yml`):

1. **`test`**: Verifica tipos con `npx tsc --noEmit` y corre todas las pruebas unitarias con `node:test`.
2. **`build`**: Compila el juego en modo producción (`npm run build-nolog`).
3. **`pages`**: Al hacer push a la rama principal (`main`), despliega automáticamente el juego en **GitHub Pages / GitLab Pages** para jugarlo en la web.

---

## 📁 Estructura del Proyecto

```text
PiramidSecretChamber/
├── .agents/             # Especificaciones de diseño y habilidades de agentes
├── .gitlab-ci.yml       # Pipeline CI/CD para GitLab y GitLab Pages
├── public/              # Recursos estáticos (sprites, audio, fuentes)
├── src/
│   ├── entities/        # Clases de entidades del juego (Player, etc.)
│   ├── grid/            # Arquitectura de rejilla y definición de las 10 recámaras
│   ├── scenes/          # Escenas de Phaser (Boot, Preloader, TitleScene, GameScene, GameOver)
│   ├── constants.ts     # Constantes de juego, dimensiones y físicas arcade
│   └── main.ts          # Punto de entrada y configuración de Phaser.Game
├── tests/               # Pruebas unitarias automatizadas (Node.js test runner)
├── package.json
└── tsconfig.json
```

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
