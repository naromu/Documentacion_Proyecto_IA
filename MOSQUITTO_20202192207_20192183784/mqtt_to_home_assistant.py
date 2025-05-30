import paho.mqtt.client as mqtt
import requests
import json

# Configuración
UMBRAL_TEMP = 28
URL_BACKEND_HA = "http://homeassistant.local:8123/api/services/notify/persistent_notification"
TOKEN_HA = "eyJ0eXAiOiJK..."  # Tu long-lived access token

headers = {
    "Authorization": f"Bearer {TOKEN_HA}",
    "Content-Type": "application/json",
}

# Conexión MQTT
def on_connect(client, userdata, flags, rc):
    print("✅ Conectado al broker")
    client.subscribe("sensor/temperatura")

# Cuando llega un mensaje
def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        temp = payload.get("temperatura")

        if temp is not None:
            print(f"🌡️ Temperatura recibida: {temp} °C")

            if temp > UMBRAL_TEMP:
                print("🚨 Temperatura alta, enviando a Home Assistant...")

                data = {
                    "title": "⚠️ Temperatura Alta",
                    "message": f"La temperatura es de {temp} °C",
                }

                response = requests.post(URL_BACKEND_HA, headers=headers, json=data)

                print("✅ Notificación enviada:", response.status_code)

            else:
                print("✅ Temperatura normal. No se envía nada.")

    except Exception as e:
        print("❌ Error procesando mensaje:", e)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("localhost", 1883, 60)
client.loop_forever()
