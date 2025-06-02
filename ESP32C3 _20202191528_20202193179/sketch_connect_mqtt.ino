/*********
  Rui Santos
  Complete project details at https://randomnerdtutorials.com  
*********/

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>

const int ledPin1 = 9;
const int ledPin2 = 8;  // Changed from 10 to 8 to avoid conflict with DHT22

// DHT22 sensor configuration
#define DHTPIN 10     // Digital pin connected to the DHT sensor 
#define DHTTYPE DHT22 // DHT 22 (AM2302)

DHT_Unified dht(DHTPIN, DHTTYPE);

// Replace the next variables with your SSID/Password combination
const char* ssid = "Papeleria_Nelsy";
const char* password = "JesusMariaJuan722";

// Add your MQTT Broker IP address, example:
//const char* mqtt_server = "192.168.1.144";
const char* mqtt_server = "173.212.224.226";

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

float temperature = 0;
float humidity = 0;

// LED Pin
const int ledPin = 4;

void setup() {
  Serial.begin(115200);
  
  // Initialize DHT22 sensor
  dht.begin();
  Serial.println(F("DHT22 sensor initialized"));
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();
  if(messageTemp == "{'bombilla':'ON'}"){
    digitalWrite(ledPin1, HIGH);
  }
  if(messageTemp == "{'bombilla':'OFF'}"){
    digitalWrite(ledPin1, LOW);
  }
  if(messageTemp == "{'ventilador':'ON'}"){
    digitalWrite(ledPin2, HIGH);
  }
  if(messageTemp == "{'ventilador':'OFF'}"){
    digitalWrite(ledPin2, LOW);
  }

  // Feel free to add more if statements to control more GPIOs with MQTT

  // If a message is received on the topic esp32/output, you check if the message is either "on" or "off". 
  // Changes the output state according to the message
  if (String(topic) == "python/mqtt") {
    Serial.print("Changing output to ");
    if(messageTemp == "on"){
      Serial.println("on");
      digitalWrite(ledPin1, HIGH);
    }
    else if(messageTemp == "off"){
      Serial.println("off");
      digitalWrite(ledPin2, LOW);
    }
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("python/mqtt");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    
    // Read temperature from DHT22 sensor
    sensors_event_t event;
    dht.temperature().getEvent(&event);
    if (isnan(event.temperature)) {
      Serial.println(F("Error reading temperature from DHT22!"));
      temperature = -999; // Error value
    } else {
      temperature = event.temperature;
    }
    
    // Read humidity from DHT22 sensor
    dht.humidity().getEvent(&event);
    if (isnan(event.relative_humidity)) {
      Serial.println(F("Error reading humidity from DHT22!"));
      humidity = -999; // Error value
    } else {
      humidity = event.relative_humidity;
    }
    
    // Only send data if readings are valid
    if (temperature != -999 && humidity != -999) {
      // Create JSON message with real sensor data
      char jsonMessage[100];
      sprintf(jsonMessage, "{\"temperature\":%.2f,\"humidity\":%.2f}", temperature, humidity);
      
      Serial.print("DHT22 readings - ");
      Serial.print("Temperature: "); Serial.print(temperature); Serial.print("°C, ");
      Serial.print("Humidity: "); Serial.print(humidity); Serial.println("%");
      Serial.print("Sending JSON: ");
      Serial.println(jsonMessage);
      client.publish("python/mqtt", jsonMessage);
    } else {
      Serial.println("Skipping MQTT publish due to sensor read errors");
    }
  }
}
