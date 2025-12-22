#!/bin/bash

echo "🚀 Запуск Blozhik Dev Environment"
echo "================================="

# Проверка наличия зависимостей
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo не установлен. Установите Rust: https://rustup.rs/"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm не установлен. Установите: npm install -g pnpm"
    exit 1
fi

# Функция для остановки серверов
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Обработка сигналов для корректной остановки
trap cleanup SIGINT SIGTERM

echo "📦 Установка зависимостей фронтенда..."
cd "$(dirname "$0")"
pnpm install

echo ""
echo "🔧 Запуск бэкенда (Rust)..."
cd server-rust
cargo run &
BACKEND_PID=$!

echo "⏳ Ожидание запуска бэкенда..."
sleep 5

# Проверка, что бэкенд запустился
if ! curl -s http://localhost:8080/healthz > /dev/null; then
    echo "❌ Бэкенд не запустился. Проверьте логи выше."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Бэкенд запущен: http://localhost:8080"

echo ""
echo "🎨 Запуск фронтенда (React)..."
cd ..
VITE_API_URL=http://localhost:8080/api/trpc npx vite --port 3030 &
FRONTEND_PID=$!

echo "⏳ Ожидание запуска фронтенда..."
sleep 3

echo ""
echo "🎉 Оба сервера запущены!"
echo "========================"
echo "🌐 Фронтенд: http://localhost:3030"
echo "🔧 Бэкенд:  http://localhost:8080"
echo "🩺 Health:   http://localhost:8080/healthz"
echo ""
echo "Нажмите Ctrl+C для остановки серверов"

# Ожидание завершения
wait