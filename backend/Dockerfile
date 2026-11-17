# Imagen oficial estable de Python 3.12 (evita errores de compilación de 3.14)
FROM python:3.12-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# 1) Copiar e instalar dependencias primero (aprovecha la caché de Docker)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2) Copiar el código fuente del backend
COPY . .

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando de arranque: escucha en 0.0.0.0 para ser accesible desde fuera del contenedor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]