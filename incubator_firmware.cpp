#include "DHT.h"
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <SSD1306Wire.h>
#include <Ticker.h>
#include <WiFiManager.h>
#include <Wire.h>

// --- CONFIGURACIÓN FIJA ---
// --- CONFIGURACIÓN DINÁMICA ---
char serverUrl[64] = "https://incubator-backend.vercel.app";
const char *deviceId = "777cec09-f5ca-4af4-8082-d8047aed6041";

// Configuración OLED I2C
SSD1306Wire display(0x3C, 14, 12); // D5=SCL (14), D6=SDA (12)

// Pines (Estrictamente según tu configuración física)
#define Heater 15 // D8
#define Cooler 13 // D7
#define Fan 10    // SD3 (Movido de D6/12 para evitar conflicto con SDA)
#define Turning 2 // D4 (Movido de GPIO 9/SD2 para evitar crashes de Flash)
#define DHTPIN 4  // D2
#define DHTTYPE DHT11

// Botones (D0=16, D1=5, D3=0)
#define btn1 16 // D0 -> Gallina
#define btn2 0  // D3 -> Pato
#define btn3 5  // D1 -> Codorniz

#define Heater_OFF digitalWrite(Heater, LOW)
#define Heater_ON digitalWrite(Heater, HIGH)
#define Cooler_OFF digitalWrite(Cooler, LOW)
#define Cooler_ON digitalWrite(Cooler, HIGH)
#define Fan_OFF digitalWrite(Fan, LOW)
#define Fan_ON digitalWrite(Fan, HIGH)
#define Turning_OFF digitalWrite(Turning, LOW)
#define Turning_ON digitalWrite(Turning, HIGH)

DHT dht(DHTPIN, DHTTYPE);
float Temperature = 0;
float Setpoint = 37.5;
float Humidity = 0;
float HumiditySetpoint = 50.0;
unsigned long timer_counter = 0;
unsigned long day_counter = 0;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 20000;
unsigned long turningInterval = 72000;
unsigned long turningDuration = 450;
int eggType = 0;
Ticker ticker;

// Banderas de Alerta
bool alertTempHigh = false;
bool alertTempLow = false;
bool alertHumHigh = false;
bool alertHumLow = false;
volatile bool alertMotorActive = false;

// --- COMUNICACIÓN ---

void sendData() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Necesario para Vercel (HTTPS)
    HTTPClient http;
    String url = String(serverUrl) + "/readings";
    Serial.print("Sending reading to: ");
    Serial.println(url);
    http.begin(client, url);
    http.setTimeout(15000);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["temperature"] = Temperature;
    doc["humidity"] = Humidity;

    String jsonStr;
    serializeJson(doc, jsonStr);

    int httpResponseCode = http.POST(jsonStr);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Reading Response code: ");
      Serial.println(httpResponseCode);
      if (httpResponseCode != 201 && httpResponseCode != 200) {
        String payload = http.getString();
        Serial.println("Response: " + payload);
      }
    } else {
      Serial.print("Reading Error code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
}

void sendAlert(String type, String message) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = String(serverUrl) + "/alerts";
    Serial.print("Sending alert to: ");
    Serial.println(url);
    http.begin(client, url);
    http.setTimeout(15000);
    http.addHeader("Content-Type", "application/json");
    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["type"] = type;
    doc["message"] = message;
    String jsonStr;
    serializeJson(doc, jsonStr);
    int httpResponseCode = http.POST(jsonStr);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Alert Response code: ");
      Serial.println(httpResponseCode);
      if (httpResponseCode != 201 && httpResponseCode != 200) {
        String payload = http.getString();
        Serial.println("Response: " + payload);
      }
    } else {
      Serial.print("Alert Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void syncEggMode(int modeValue) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = String(serverUrl) + "/devices/sync-mode";
    Serial.println("Syncing mode to: " + url);
    http.begin(client, url);
    http.setTimeout(15000);
    http.addHeader("Content-Type", "application/json");
    StaticJsonDocument<512> doc;
    doc["device_id"] = deviceId;
    doc["mode"] = modeValue;
    doc["current_day"] = (int)((day_counter / 864000) + 1);
    doc["turning_active"] = (digitalRead(Turning) == HIGH);
    String jsonStr;
    serializeJson(doc, jsonStr);
    int httpResponseCode = http.POST(jsonStr);
    if (httpResponseCode > 0) {
      Serial.println("Sync Response: " + String(httpResponseCode));
    } else {
      Serial.println("Error syncing mode: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("WiFi disconnected, cannot sync mode");
  }
}

// --- GESTOR WIFI ---

void connectWiFi() {
  display.clear();
  display.drawString(0, 0, "WiFi: Buscando...");
  display.display();

  WiFiManager wm;

  // Agregar parámetro para la URL del servidor
  WiFiManagerParameter custom_server_url(
      "server", "IP Servidor (http://ip:3000)", serverUrl, 64);
  wm.addParameter(&custom_server_url);

  wm.setConfigPortalTimeout(180);

  if (!wm.autoConnect("Incubadora_Config")) {
    Serial.println("Offline Mode");
  } else {
    // Guardar el valor configurado y limpiar espacios
    String tempUrl = custom_server_url.getValue();
    tempUrl.trim();
    if (tempUrl.endsWith("/")) {
      tempUrl.remove(tempUrl.length() - 1);
    }
    strcpy(serverUrl, tempUrl.c_str());
    Serial.println("Server URL configurada: " + String(serverUrl));

    // Prueba de conexión inmediata (Ping)
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    http.begin(client, String(serverUrl) + "/ping");
    http.setTimeout(15000);
    int code = http.GET();
    if (code > 0) {
      Serial.println("Prueba de servidor /ping EXITOSA: " + String(code));
    } else {
      Serial.println("FALLA al conectar al servidor /ping: " +
                     String(http.errorToString(code)));
    }
    http.end();

    display.clear();
    display.drawString(0, 0, "WiFi Conectado!");
    display.drawString(0, 15, String("IP: ") + WiFi.localIP().toString());
    display.display();
    delay(2000);
  }
}

void showMessage(String l1, String l2) {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.drawString(0, 0, l1);
  display.drawString(0, 15, l2);
  display.display();
  delay(1500);
}

void Display_Menu() {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.drawString(0, 0, "Seleccione huevo:");
  display.drawString(0, 15, "1:Gallina 2:Pato");
  display.drawString(0, 30, "3:Codorniz");
  display.display();
}

// --- LÓGICA DE CONTROL ---

void setup() {
  Serial.begin(115200);
  pinMode(Heater, OUTPUT);
  digitalWrite(Heater, LOW);
  pinMode(Cooler, OUTPUT);
  pinMode(Fan, OUTPUT);
  pinMode(Turning, OUTPUT);
  pinMode(btn1, INPUT_PULLUP);
  pinMode(btn2, INPUT_PULLUP);
  pinMode(btn3, INPUT_PULLUP);

  display.init();
  display.flipScreenVertically();
  connectWiFi();

  dht.begin();
  ticker.attach_ms(100, timerIsr);
}

void loop() {
  checkEggSelection();
  if (eggType != 0) {
    Read_DHT11();
    updateHumiditySetpoint();
    Temperature_control();
    Humidity_control();
    Motor_alert_check();
    PrintTemp();
    if (millis() - lastSendTime >= sendInterval) {
      sendData();
      lastSendTime = millis();
    }
  } else {
    Display_Menu();
    // Resetear WiFi con botones 1 y 3 (GPIO 16 y 0)
    if (digitalRead(btn1) == LOW && digitalRead(btn3) == LOW) {
      WiFiManager wm;
      wm.startConfigPortal("Incubadora_RECONFIG");
    }
    delay(200);
  }
}

void Temperature_control() {
  if (Temperature >= Setpoint + 0.5) {
    Heater_OFF;
    Cooler_ON;
    Fan_ON;
    if (!alertTempHigh) {
      sendAlert("TEMP_HIGH", "Temp alta: " + String(Temperature) + "C");
      alertTempHigh = true;
    }
  } else if (Temperature <= Setpoint - 0.5) {
    Heater_ON;
    Fan_ON;
    Cooler_OFF;
    if (!alertTempLow) {
      sendAlert("TEMP_LOW", "Temp baja: " + String(Temperature) + "C");
      alertTempLow = true;
    }
  } else {
    Heater_OFF;
    Cooler_OFF;
    Fan_ON;
    if (Temperature < Setpoint + 0.3 && alertTempHigh)
      alertTempHigh = false;
    if (Temperature > Setpoint - 0.3 && alertTempLow)
      alertTempLow = false;
  }
}

void Humidity_control() {
  if (Humidity >= 80.0) {
    if (!alertHumHigh) {
      sendAlert("HUM_HIGH", "Humedad alta: " + String(Humidity) + "%");
      alertHumHigh = true;
    }
  } else if (Humidity <= 40.0) {
    if (!alertHumLow) {
      sendAlert("HUM_LOW", "Humedad baja: " + String(Humidity) + "%");
      alertHumLow = true;
    }
  } else {
    if (Humidity <= 78.0 && alertHumHigh)
      alertHumHigh = false;
    if (Humidity >= 42.0 && alertHumLow)
      alertHumLow = false;
  }
}

void Motor_alert_check() {
  if (alertMotorActive) {
    sendAlert("MOTOR_ACTIVE", "Rotación iniciada");
    alertMotorActive = false;
  }
}

void timerIsr() {
  timer_counter++;
  if (timer_counter % 864000 == 0)
    day_counter++;
  if (eggType != 0) {
    if (timer_counter > (turningInterval - turningDuration) &&
        timer_counter < turningInterval) {
      if (digitalRead(Turning) == LOW)
        alertMotorActive = true;
      Turning_ON;
    } else {
      Turning_OFF;
    }
    if (timer_counter > turningInterval)
      timer_counter = 0;
  }
}

void checkEggSelection() {
  if (digitalRead(btn1) == LOW) { // D0 -> Gallina
    eggType = 1;
    turningInterval = 72000;
    turningDuration = 450;
    Setpoint = 37.65;
    day_counter = 0;
    showMessage("Huevo Gallina", "Modo Activo");
    syncEggMode(1);
    delay(500); // Debounce
  }
  if (digitalRead(btn2) == LOW) { // D3 -> Pato
    eggType = 2;
    turningInterval = 108000;
    turningDuration = 600;
    Setpoint = 37.75;
    day_counter = 0;
    showMessage("Huevo Pato", "Modo Activo");
    syncEggMode(2);
    delay(500); // Debounce
  }
  if (digitalRead(btn3) == LOW) { // D1 -> Codorniz
    eggType = 3;
    turningInterval = 36000;
    turningDuration = 300;
    Setpoint = 37.65;
    day_counter = 0;
    showMessage("Huevo Codorniz", "Modo Activo");
    syncEggMode(3);
    delay(500); // Debounce
  }
}

void Read_DHT11() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    Humidity = h;
    Temperature = t;
  }
}

void updateHumiditySetpoint() {
  unsigned long totalTicksDia = 864000;
  switch (eggType) {
  case 1:
    HumiditySetpoint = (day_counter < 18 * totalTicksDia) ? 52.5 : 67.5;
    break;
  case 2:
    HumiditySetpoint = (day_counter < 14 * totalTicksDia) ? 52.5 : 67.5;
    break;
  case 3:
    HumiditySetpoint = (day_counter < 25 * totalTicksDia) ? 57.5 : 72.5;
    break;
  }
}

void PrintTemp() {
  display.clear();
  display.setFont(ArialMT_Plain_16);
  display.drawString(0, 0,
                     String(Temperature, 1) + "C " + String(Humidity, 1) + "%");
  display.setFont(ArialMT_Plain_10);
  display.drawString(0, 20,
                     "D:" + String((day_counter / 864000) + 1) +
                         " S:" + String(Setpoint, 1));
  display.drawString(
      0, 35,
      (WiFi.status() == WL_CONNECTED ? "Wifi:OK " : "Wifi:ERR ") +
          String(deviceId).substring(0, 8));
  display.display();
}
