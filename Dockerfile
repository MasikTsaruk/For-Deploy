FROM python:3.10-slim

# Установим необходимые зависимости для psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Установим зависимости
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . /app/

# Убедимся, что у нас правильные права доступа к папкам
RUN chmod +x /app/back/manage.py

# Экспонируем порт
EXPOSE 8000
ENV DJANGO_SETTINGS_MODULE=back.back.settings

# Команда по умолчанию
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

