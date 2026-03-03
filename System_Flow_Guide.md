# Guía de Funcionamiento: Incubator App (Backend & Firmware)

Este documento explica la lógica de negocio, la arquitectura de la API y el flujo de comunicación entre el hardware (ESP8266) y el servidor (NestJS + Supabase).

## 1. Arquitectura del Sistema

El sistema se basa en una arquitectura de **monitoreo en tiempo real** y **sincronización de estado**:

- **Hardware (ESP8266)**: Actúa como el controlador físico. Lee sensores (DHT11), controla actuadores (Calentador, Ventilador, Motor) y reporta datos vía HTTP.
- **Backend (NestJS)**: Procesa las lecturas, gestiona la autenticación, almacena el historial en Supabase y mantiene el estado actual en **Redis** para acceso instantáneo.
- **Base de Datos (Supabase)**: Almacenamiento persistente de usuarios, dispositivos, lecturas y alertas.

---

## 2. Flujo de Comunicación (Hardware -> App)

### A. Registro de Lecturas (`POST /readings`)
Cada 20 segundos, la ESP8266 envía un JSON con la temperatura y humedad actuales.
- **Lógica**: Si la lectura es válida, el backend la guarda en la tabla `Reading` y actualiza una llave en Redis con el prefijo `device:reading:{device_id}`.

### B. Gestión de Alertas (`POST /alerts`)
Cuando la placa detecta un valor fuera de rango (ej: Temp < 37°C), envía una alerta.
- **Lógica de "Anti-Spam"**: La placa usa banderas (flags) internas. Envía la alerta una vez y no vuelve a avisar hasta que el valor regrese al rango normal y se resetee la bandera.

### C. Sincronización de Modos (`POST /devices/sync-mode`)
Cuando el usuario presiona un botón físico en la incubadora (Gallina, Codorniz, Pato):
1. La placa cambia sus setpoints internos.
2. Envía un POST al backend con el nuevo `mode` y el `current_day`.
3. El backend actualiza la tabla `Device`, sincronizando la "realidad física" con la App.

---

## 3. Seguridad y Vinculación

### Autenticación (Supabase Auth)
- El sistema usa **JWT (JSON Web Tokens)**.
- El `user_id` de la tabla `User` debe coincidir con el ID interno de Supabase (procedimiento de Registro -> Perfil).

### Vinculación de Dispositivos (`POST /devices/link`)
Para que un usuario vea sus datos, debe "reclamar" su incubadora usando su `device_id` único (UUIDv4). Esto vincula la columna `user_id` en la tabla `Device`.

---

## 4. Referencia Detallada de la API (para Frontend)

Todos los endpoints (excepto los de la ESP8266) requieren el header:
`Authorization: Bearer <JWT_TOKEN>`

### A. Autenticación (`/auth`)

#### `POST /auth/register`
- **Uso**: Registro de nuevo usuario.
- **Body**: `{ "email": "...", "password": "...", "name": "..." }`
- **Nota**: Crea automáticamente el perfil en la base de datos.

#### `POST /auth/login`
- **Uso**: Inicio de sesión.
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "access_token": "...", "user": { ... }, "refresh_token": "..." }`

#### `POST /auth/refresh`
- **Uso**: Renovar token expirado.
- **Body**: `{ "refresh_token": "..." }`

---

### B. Dispositivos (`/devices`)

#### `POST /devices/link` (PROTEGIDO)
- **Uso**: El usuario vincula una incubadora física a su cuenta.
- **Body**: `{ "device_id": "UUID-UNICO", "device_name": "Mi Incubadora" }`

#### `GET /devices` (PROTEGIDO)
- **Uso**: Lista todas las incubadoras vinculadas al usuario actual.

#### `POST /devices/sync-mode` (PÚBLICO - ESP8266)
- **Uso**: Sincroniza el modo físico (botón) con la nube.
- **Body**: `{ "device_id": "...", "mode": 1, "current_day": 5, "turning_active": true }`

---

### C. Lecturas (`/readings`)

#### `POST /readings` (PÚBLICO - ESP8266)
- **Uso**: Envío de datos desde los sensores.
- **Body**: `{ "device_id": "...", "temperature": 37.5, "humidity": 55.0 }`

#### `GET /readings/latest/:deviceId` (PROTEGIDO)
- **Uso**: Obtener el estado actual en tiempo real para el dashboard (usa Redis).

#### `GET /readings/history/:deviceId?limit=50` (PROTEGIDO)
- **Uso**: Datos históricos para gráficas.

#### `GET /readings/export/:deviceId` (PÚBLICO/LINK)
- **Uso**: Descarga un archivo `.csv` compatible con Excel.

#### `DELETE /readings/clean/:deviceId?days=1` (PROTEGIDO)
- **Uso**: Borra historial antiguo para liberar espacio.

---

### D. Alertas (`/alerts`)

#### `POST /alerts` (PÚBLICO - ESP8266)
- **Uso**: Registra un evento crítico detectado por la placa.
- **Body**: `{ "device_id": "...", "type": "TEMP_HIGH", "message": "..." }`

#### `GET /alerts/:deviceId?limit=20` (PROTEGIDO)
- **Uso**: Lista de notificaciones/alertas recientes para el usuario.

---

## 5. Glosario de Campos (Schema)

- `device_id`: Identificador único de la máquina (UUIDv4).
- `mode`: 1 (Gallina), 2 (Pato), 3 (Codorniz).
- `turning_active`: Booleano (true/false) para el motor de volteo.
- `current_day`: Día de incubación transcurrido.
- `type` (Alertas): `TEMP_HIGH`, `TEMP_LOW`, `HUM_HIGH`, `HUM_LOW`, `MOTOR_ACTIVE`.

## 6. Hosting
- **Base URL (PROD)**: `https://incubator-backend.vercel.app`
- **Base URL (DEV)**: `http://localhost:3000`
