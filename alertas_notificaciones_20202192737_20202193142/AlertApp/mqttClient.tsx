// mqttClient.tsx
import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { MqttConfig, DEFAULT_CONFIG } from './mqttConfig';

let client: MqttClient | null = null;
let currentConfig: MqttConfig = DEFAULT_CONFIG;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const getClientOptions = (config: MqttConfig): IClientOptions => ({
  host: config.host,
  port: config.port,
  protocol: 'ws',
  connectTimeout: 5000, // Reducido a 5 segundos para fallar más rápido
  reconnectPeriod: 0, // Desactivamos la reconexión automática para manejarla manualmente
  keepalive: 30, // Reducido a 30 segundos
  clean: true,
  rejectUnauthorized: false,
  will: {
    topic: `${config.topic}/status`,
    payload: 'offline',
    qos: 1,
    retain: true
  }
});

const handleConnectionError = (error: Error) => {
  console.error('Error de conexión MQTT:', error);
  reconnectAttempts++;
  
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('Máximo número de intentos de reconexión alcanzado');
    if (client) {
      try {
        client.end();
      } catch (err) {
        console.error('Error cerrando cliente después de máximo intentos:', err);
      }
    }
    client = null;
    reconnectAttempts = 0;
  }
};

export const initializeMqttClient = (config: MqttConfig) => {
  if (client) {
    try {
      client.removeAllListeners();
      client.end(true, () => {
        console.log('Cliente MQTT anterior cerrado');
      });
    } catch (error) {
      console.error('Error cerrando cliente MQTT anterior:', error);
    }
  }
  
  currentConfig = config;
  reconnectAttempts = 0;
  const options = getClientOptions(config);
  console.log('Inicializando cliente MQTT con opciones:', options);
  
  try {
    const url = `ws://${config.host}:${config.port}`;
    console.log('Conectando a:', url);
    
    client = mqtt.connect(url, options);
    
    client.on('connect', () => {
      console.log('Cliente MQTT conectado exitosamente');
      reconnectAttempts = 0;
      // Publicar estado online
      client?.publish(`${config.topic}/status`, 'online', { qos: 1, retain: true });
    });

    client.on('error', (error) => {
      console.error('Error en cliente MQTT:', error);
      handleConnectionError(error);
    });

    client.on('close', () => {
      console.log('Conexión MQTT cerrada');
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          if (client) {
            console.log(`Intento de reconexión ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
            client.reconnect();
          }
        }, 5000);
      }
    });

    client.on('reconnect', () => {
      console.log(`Intentando reconectar MQTT (intento ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
    });

    client.on('offline', () => {
      console.log('Cliente MQTT desconectado');
    });

    return client;
  } catch (error) {
    console.error('Error creando cliente MQTT:', error);
    handleConnectionError(error as Error);
    throw error;
  }
};

export const getMqttClient = () => {
  if (!client) {
    client = initializeMqttClient(currentConfig);
  }
  return client;
};

export const getCurrentConfig = () => currentConfig;

export const resetConnection = () => {
  reconnectAttempts = 0;
  if (client) {
    try {
      client.end();
    } catch (error) {
      console.error('Error reseteando conexión:', error);
    }
  }
  client = null;
  return initializeMqttClient(currentConfig);
};
