# Blozhik

Коротко: Blozhik — простой блог/новостной движок (frontend + backend) с локальной sqlite базой и утилитами для разработки.

## Быстрый старт

Требования:
- Node.js 18+ (рекомендуется)
- pnpm (используется в проекте)

Установка зависимостей:
```bash
pnpm install
```

Запуск в режиме разработки (сервер + клиент):
```bash
pnpm run dev
```

Сборка и запуск в продакшн:
```bash
pnpm run build
pnpm run start
```

Проверка типов и тесты:
```bash
pnpm run check
pnpm run test
```

## Настройка переменных окружения
- Создайте файл `.env` на основе `.env.example` и заполните значения.
- Никогда не коммитьте реальные секреты (токены, пароли, приватные ключи) — `.env` уже в `.gitignore`.

## Сидирование тестовых аккаунтов
Есть вспомогательные скрипты для создания тестовых пользователей:
```bash
pnpm run seed:admin
pnpm run seed:moderator
```

## Бекапы и файлы БД
- Локальная sqlite база: `blozhik.db` и `blozhik.db.bak` — они добавлены в `.gitignore`.

## Документация
- Локальная админ-документация находится в `DOCS_SITE_ADMIN.md` (файл по умолчанию игнорируется в репозитории).

## GitHub Pages (main/docs) — автоматический деплой
Сайт публикуется в `main/docs` с помощью GitHub Actions. Workflow `Build & Publish docs to main/docs` автоматически собирает фронтенд и обновляет папку `docs/` в ветке `main`.

Локально можно обновить `docs/` и запушить:
```bash
pnpm run build:docs
git add docs
git commit -m "chore(docs): update docs [skip ci]" || echo "no docs changes"
git push origin main
```

После пуша в `main` в Pages (Settings → Pages) установите `Source: main`, `Folder: / (root)` и откройте `https://<username>.github.io/blozhik/`.

## Предупреждения
- Если секрет уже попал в историю Git, используйте `git filter-repo` или BFG для очистки истории (внимательно — операция меняет историю и требует force-push и координации с командой).

---

Если нужно — могу расширить README: добавить примеры API, структуру проекта или инструкции по деплою.
