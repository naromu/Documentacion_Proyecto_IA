# Home Assistant Configuration

Esta es la configuración de Home Assistant para el proyecto de monitoreo con ESP32 y sensores DHT22.

## Descripción

Este proyecto incluye:
- Sensores de temperatura y humedad ESP32 DHT22 via MQTT
- Control de bombilla y ventilador via MQTT  
- Dashboard personalizado con gráficos históricos
- Automatizaciones para control automático
- Base de datos configurada para almacenar historia de sensores

## Archivos principales

- `configuration.yaml` - Configuración principal de Home Assistant
- `automations.yaml` - Automatizaciones del sistema
- `ui-lovelace.yaml` - Dashboard principal
- `dashboard-graphs.yaml` - Dashboard con gráficos históricos
- `dashboard_cards_config.yaml` - Configuración de tarjetas
- `secrets.yaml` - Variables de configuración sensibles
- `.gitignore` - Archivos a ignorar por git

## Sensores MQTT

### Sensores de temperatura y humedad
- **Temperatura**: `sensor.esp32_dht22_temperatura`
- **Humedad**: `sensor.esp32_dht22_humedad`
- **Topic MQTT**: `sensor/temperatura`

### Switches/Actuadores
- **Bombilla**: `switch.esp32_bombilla`
- **Ventilador**: `switch.esp32_ventilador`

## Estructura del proyecto

```
homeassistant/
├── configuration.yaml          # Configuración principal
├── automations.yaml           # Automatizaciones
├── scripts.yaml               # Scripts (vacío)
├── scenes.yaml                # Escenas (vacío)
├── secrets.yaml               # Variables sensibles
├── ui-lovelace.yaml           # Dashboard principal
├── dashboard-graphs.yaml      # Dashboard de gráficos
├── dashboard_cards_config.yaml # Configuración de tarjetas
├── .gitignore                 # Archivos ignorados por git
└── README.md                  # Este archivo
```

## Control de versiones

Este repositorio usa Git para control de versiones. Los siguientes archivos están excluidos:

- Bases de datos (*.db, *.db-*)
- Archivos de log (*.log*)
- Archivos temporales (.storage/, deps/, tts/)
- Archivos del sistema (.HA_VERSION, .uuid, etc.)

## Uso

1. Clona este repositorio en tu directorio de configuración de Home Assistant
2. Ajusta las configuraciones en `secrets.yaml` según tu entorno
3. Reinicia Home Assistant
4. Los sensores deberían aparecer automáticamente cuando el ESP32 publique datos

## Instalación desde cero

Si necesitas recrear la configuración:

1. Instala Home Assistant
2. Copia estos archivos de configuración
3. Configura MQTT broker
4. Programa el ESP32 para publicar en los topics correctos

## Contribuir

Para hacer cambios:

1. Haz los cambios necesarios en los archivos de configuración
2. Prueba que Home Assistant funcione correctamente
3. Commit los cambios: `git add . && git commit -m "Descripción del cambio"`

## Notas importantes

- Revisa siempre `secrets.yaml` antes de hacer commit para evitar exponer credenciales
- Los archivos de base de datos y logs están ignorados automáticamente
- La configuración está optimizada para ESP32 con sensores DHT22 