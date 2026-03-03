# Sistema de Control e Incubación Inteligente IoT

Este proyecto consiste en un ecosistema integral para la automatización y supervisión remota de incubadoras de aves. Utiliza una arquitectura distribuida que conecta hardware de control local con servicios en la nube para garantizar un entorno óptimo de incubación y el registro histórico de variables críticas.

## Resumen del Proyecto

La solución automatiza procesos de control térmico, humedad y rotación de huevos mediante un nodo sensor/actuador basado en ESP8266. Los datos son procesados por un backend desarrollado en NestJS, que centraliza la lógica de negocio y persiste la información en una base de datos PostgreSQL gestionada por Supabase.

## Arquitectura del Sistema

El sistema se estructura en tres capas interconectadas:

1. Firmware (Hardware): Ejecutado en una placa ESP8266. Se encarga de la lectura de sensores DHT11, la ejecución de algoritmos de control para el calefactor y ventilación, la gestión del motor de volteo y la visualización de datos en una pantalla OLED.
2. Backend (Servidor): Desarrollado con NestJS en TypeScript. Actúa como gateway para recibir telemetría, validar la identidad de los dispositivos y gestionar las alertas de sistema.
3. Base de Datos: Instancia de PostgreSQL en Supabase. Utiliza un modelo relacional para vincular usuarios, dispositivos, lecturas de sensores y registros de alertas.



## Modelo de Datos (MER)

La estructura de la base de datos sigue un diseño orientado a la escalabilidad:

- User: Gestión de identidad y metadatos de los usuarios.
- Device: Registro de cada unidad física, incluyendo modo de operación (Gallina, Codorniz, Pato) y progreso del ciclo.
- Reading: Almacenamiento cronológico de telemetría (temperatura y humedad) con resolución de 20 segundos.
- Alert: Bitácora de incidencias críticas, fallos de conexión o recordatorios de mantenimiento.



## Stack Tecnologico

- Hardware: ESP8266 (NodeMCU), Sensor DHT11, Pantalla OLED I2C.
- Backend: NestJS, TypeScript, Node.js.
- Base de Datos: PostgreSQL, Supabase.
- Comunicación: Protocolo HTTP con intercambio de datos en formato JSON.

## Pre-requisitos

- **Node.js**: Versión 16 o superior.
- **Supabase**: Cuenta activa y un proyecto creado (PostgreSQL + Auth).
- **Redis**: Se recomienda **Upstash** (Serverless Redis) para compatibilidad con Vercel.
- **Arduino IDE**: Con soporte para ESP8266 y librerías necesarias (DHT, ArduinoJson, WiFiManager, SSD1306Wire).

## Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/rsamueldev/incubator-app.git
cd incubator-app
```

### 2. Configuración del Backend (.env)
Crea un archivo `.env` en la raíz con las siguientes variables:
```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key

# Redis (Upstash recomendado)
REDIS_HOST=tu-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=tu-password

# Seguridad
JWT_SECRET=una-clave-secreta-segura
```

### 3. Ejecución Local
```bash
npm install
npm run start:dev
```
El servidor iniciará en `http://localhost:3000`.

### 4. Despliegue en Producción (Vercel)
El proyecto está configurado para Vercel. Solo necesitas:
1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar: `vercel`
3. Configurar las variables de entorno en el panel de Vercel.

---

## Configuración del Firmware (ESP8266)

1. Abre `incubator_firmware.cpp` en Arduino IDE.
2. Asegúrate de tener instaladas las librerías: `DHT sensor library`, `ArduinoJson`, `WiFiManager`, `ESP8266_and_ESP32_OLED_Driver_for_SSD1306_displays`.
3. Sube el código a tu placa NodeMCU/ESP8266.
4. **Portal Cautivo**: Al encenderse, si no hay WiFi, la placa creará un punto de acceso llamado `Incubadora_Config`. Conéctate con tu celular para configurar el WiFi y la URL del servidor (ej: `https://tu-app.vercel.app`).

---

## Documentación Adicional
- [Guía de Flujo del Sistema](./System_Flow_Guide.md): Detalle técnico de la lógica y referencia completa de la API para el equipo de Frontend.

## Funcionamiento General

Tras la configuración inicial, el dispositivo inicia un proceso de conexión WiFi. Una vez establecido el enlace, el usuario selecciona el tipo de ave en el menú físico. El sistema ajusta los setpoints térmicos y de humedad automáticamente. Cada 20 segundos, el hardware envía una actualización de estado al servidor NestJS, el cual actualiza el tablero en tiempo real y registra la información para auditoría posterior.
