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

## Configuracion del Entorno

### Backend
1. Clonar el repositorio y ejecutar npm install para instalar las dependencias.
2. Configurar las variables de entorno SUPABASE_URL y SUPABASE_KEY en un archivo .env.
3. Iniciar el servidor mediante npm run start:dev.

### Firmware
1. Abrir el proyecto en el IDE de Arduino.
2. Configurar las credenciales de la red local (SSID/Password).
3. Insertar el UUID del dispositivo generado en la tabla de base de datos en la variable de endpoint.
4. Realizar el despliegue a la placa ESP8266.

## Funcionamiento General

Tras la configuración inicial, el dispositivo inicia un proceso de conexión WiFi. Una vez establecido el enlace, el usuario selecciona el tipo de ave en el menú físico. El sistema ajusta los setpoints térmicos y de humedad automáticamente. Cada 20 segundos, el hardware envía una actualización de estado al servidor NestJS, el cual actualiza el tablero en tiempo real y registra la información para auditoría posterior.
