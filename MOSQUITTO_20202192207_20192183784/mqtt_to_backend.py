import paho.mqtt.client as mqtt
import requests

BACKEND_URL = "http://localhost:5000/api/mensaje"  # Dirección del backend local

def on_connect(client, userdata, flags, rc):
    print("✅ Conectado a MQTT Broker")
    client.subscribe("sensor/temperatura")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"📡 Mensaje MQTT: {msg.topic} -> {payload}")

    # Enviar al backend
    data = {
        "topic": msg.topic,
        "valor": payload
    }

    try:
        response = requests.post(BACKEND_URL, json=data)
        print("📤 Enviado al backend:", response.status_code)
    except Exception as e:
        print("❌ Error enviando al backend:", e)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("localhost", 1883, 60)
client.loop_forever()
