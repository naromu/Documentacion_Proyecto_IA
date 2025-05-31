# predictor.py

import joblib
import numpy as np

# Cargar el modelo al iniciar
modelo = joblib.load("modelo_temperatura.pkl")

def predecir_temperatura(ultimas_60_temp):
    """
    Recibe una lista o array con 60 temperaturas recientes (últimos 60 minutos),
    y devuelve la predicción de temperatura para dentro de 1 hora.
    """
    if len(ultimas_60_temp) != 60:
        raise ValueError("La lista debe contener exactamente 60 valores de temperatura.")

    entrada = np.array(ultimas_60_temp).reshape(1, -1)
    prediccion = modelo.predict(entrada)[0]
    return round(prediccion, 2)
