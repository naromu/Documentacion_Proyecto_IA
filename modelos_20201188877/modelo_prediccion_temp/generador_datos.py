import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Inicializa el generador de números aleatorios con una semilla para reproducibilidad
rng = np.random.default_rng(seed=42)

# Número total de minutos a simular (7 días)
minutos_totales = 7 * 24 * 60

# Listas para almacenar los valores simulados de temperatura y sus timestamps correspondientes
temperaturas = []
timestamps = []

# Fecha y hora de inicio de la simulación
inicio = datetime(2025, 5, 1, 0, 0, 0)

# Bucle para generar una lectura de temperatura por cada minuto
for minuto in range(minutos_totales):
    # Calcula el timestamp actual sumando los minutos al tiempo inicial
    current_time = inicio + timedelta(minutes=minuto)
    timestamps.append(current_time)

    # Convierte la hora actual a formato decimal (ej. 14:30 -> 14.5)
    hora_decimal = current_time.hour + current_time.minute / 60.0

    # Calcula una temperatura base con comportamiento sinusoidal diario
    # Temperaturas más bajas en la madrugada (~23°C) y más altas al mediodía (~38°C)
    temp_base = 30.5 + 7.5 * np.sin((hora_decimal - 6) * np.pi / 12)

    # Agrega ruido gaussiano para simular variabilidad natural
    ruido = rng.normal(loc=0, scale=0.5)

    # Temperatura final simulada, redondeada a 2 decimales
    temperatura = round(temp_base + ruido, 2)
    temperaturas.append(temperatura)

# Crear un DataFrame con los timestamps y temperaturas generadas
df = pd.DataFrame({
    "timestamp": timestamps,
    "temperatura": temperaturas
})

# Guardar el DataFrame como archivo CSV sin índice
df.to_csv("temperaturas_simuladas.csv", index=False)

# Mensaje de éxito
print("✅ Datos generados con Generator y guardados en 'temperaturas_simuladas.csv'")
