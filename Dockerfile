FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь back в /app/back
COPY back /app/back

# Устанавливаем рабочую директорию на /app/back — здесь лежит manage.py
WORKDIR /app/back

# Делаем manage.py исполняемым
RUN chmod +x manage.py

EXPOSE 8000

# Устанавливаем правильный модуль настроек
ENV DJANGO_SETTINGS_MODULE=back.settings

# Запускаем daphne, указывая модуль asgi.py в back/back
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "back.asgi:application"]
