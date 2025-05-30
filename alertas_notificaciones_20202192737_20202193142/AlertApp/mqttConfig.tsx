import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MqttConfig {
  host: string;
  port: number;
  topic: string;
}

const DEFAULT_CONFIG: MqttConfig = {
  host: '173.212.224.226',
  port: 9001,
  topic: 'alertapp/test'
};

const CONFIG_STORAGE_KEY = 'mqtt_config';

export const saveMqttConfig = async (config: MqttConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error guardando configuración MQTT:', error);
    throw error;
  }
};

export const loadMqttConfig = async (): Promise<MqttConfig> => {
  try {
    const stored = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Si no hay configuración guardada, guardamos y retornamos la configuración por defecto
    await saveMqttConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error cargando configuración MQTT:', error);
    return DEFAULT_CONFIG;
  }
};

export { DEFAULT_CONFIG }; 