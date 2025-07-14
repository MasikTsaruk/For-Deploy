# Dockerfile for React frontend

FROM node:18

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь фронт
COPY . .

# Открываем порт для dev-сервера
EXPOSE 3000

# Запускаем React dev server
CMD ["npm", "start"]
