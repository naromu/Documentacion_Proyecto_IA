# probar_predictor.py

from predictor import predecir_temperatura

# Simulamos una lista de 60 temperaturas recientes (ejemplo estático)
ultimas_60 = [30.5 + 0.2 * (i % 5) for i in range(60)]  # pequeñas variaciones realistas

try:
    prediccion = predecir_temperatura(ultimas_60)
    print(f"✅ Predicción generada exitosamente: {prediccion} °C")
except Exception as e:
    print(f"❌ Error al predecir: {e}")
