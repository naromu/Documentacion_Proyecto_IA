# entrenamiento_modelo.py

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

# Leer los datos
df = pd.read_csv("temperaturas_simuladas.csv")

# Convertir a array de temperatura
temperaturas = df["temperatura"].values

# Parámetros
input_size = 60     # Últimos 60 minutos como entrada
pred_horizon = 60   # Predicción 60 minutos en el futuro

# Preparar ventanas de entrenamiento
X = []
y = []

for i in range(len(temperaturas) - input_size - pred_horizon):
    entrada = temperaturas[i : i + input_size]
    salida = temperaturas[i + input_size + pred_horizon - 1]
    X.append(entrada)
    y.append(salida)

X = np.array(X)
y = np.array(y)

# Dividir en entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Crear y entrenar el modelo
modelo = LinearRegression()
modelo.fit(X_train, y_train)

# Evaluación del modelo
y_pred = modelo.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"✅ Modelo entrenado correctamente")
print(f"📊 MAE: {mae:.2f} °C")
print(f"📊 RMSE: {rmse:.2f} °C")

# Guardar el modelo
joblib.dump(modelo, "modelo_temperatura.pkl")
print("💾 Modelo guardado como 'modelo_temperatura.pkl'")
