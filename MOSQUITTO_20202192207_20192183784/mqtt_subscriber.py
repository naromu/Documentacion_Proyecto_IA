import paho.mqtt.client as mqtt

# Configura IP local o IP donde corre Mosquitto
broker_address = "localhost"  # o "192.168.X.X" si Mosquitto está en otra máquina
topic = "esp/sensor/datos"    # Cambia según tu ESP

def on_connect(client, userdata, flags, rc):
    print(f"Conectado al broker con código: {rc}")
    client.subscribe(topic)

def on_message(client, userdata, msg):
    print(f"Mensaje recibido en {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(broker_address, 1883, 60)
client.loop_forever()
