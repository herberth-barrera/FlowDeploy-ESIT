# 1. Usar una imagen oficial y ligera de Node.js en versión LTS
FROM node:20-alpine AS builder

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar los archivos de definición de dependencias
COPY package*.json ./

# 4. Instalar todas las dependencias (incluyendo devDependencies si son necesarias para el build/test previo)
RUN npm ci

# 5. Copiar el código fuente de la aplicación
COPY . .

# --- Imagen final de producción (Multistage build para mayor ligereza y seguridad) ---
FROM node:20-alpine AS runner

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production
ENV PORT=8080

# Copiar package.json y dependencias instaladas desde la etapa anterior
COPY package*.json ./
RUN npm ci --only=production

# Copiar el código fuente ya preparado
COPY --from=builder /app/src ./src

# Crear un usuario sin privilegios por seguridad (buena práctica en contenedores)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Exponer el puerto en el que escuchará la aplicación (coincidente con PORT)
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["node", "src/server.js"]
