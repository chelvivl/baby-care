# Baby Care

PWA-заготовка для дневника малыша: сон, кормление и другие события. Данные пока не сохраняются — следующий шаг по вашему ТЗ.

## Стек

- Vite + React + TypeScript
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (manifest + service worker)

## Локально

```bash
npm install
npm run dev
```

Откройте URL из терминала (обычно `http://localhost:5173`). На телефоне в той же Wi‑Fi сети можно открыть `http://<IP-компьютера>:5173` — PWA в dev тоже включена.

## Сборка

```bash
npm run build
npm run preview
```

## Публикация

### GitHub Pages

1. Создайте репозиторий `baby-care` на GitHub и запушьте код.
2. В настройках репозитория: **Pages → Build and deployment → GitHub Actions** (или используйте workflow из `.github/workflows/deploy-pages.yml`).
3. Для Pages задайте базовый путь — в Secrets/Variables или в workflow: `VITE_BASE_PATH=/baby-care/` (если репозиторий не в корне аккаунта, путь = `/имя-репо/`).

После деплоя откройте сайт в Chrome/Safari на телефоне → «Добавить на экран» / «Установить приложение».

### Vercel / Netlify

Подключите репозиторий, build command: `npm run build`, output: `dist`.  
`VITE_BASE_PATH` оставьте `/` (по умолчанию).

## Структура

- `src/pages/` — экраны
- `src/components/` — навигация, баннер установки PWA
- `src/app/` — общие типы и константы
