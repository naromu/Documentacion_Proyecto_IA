import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Text, View, StyleSheet, FlatList, Pressable, Button, ActivityIndicator, AppState, BackHandler, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMqttClient, initializeMqttClient, getCurrentConfig } from './mqttClient';
import { MqttConfig, loadMqttConfig } from './mqttConfig';

type SensorData = {
  time: string;
  message: string;
  location: string;
  sensor: string;
  value: number;
  isNew?: boolean;
};

const STORAGE_KEY = 'sensorDataList';

interface SensorProps {
  config?: MqttConfig;
}

export default function Sensor({ config }: SensorProps) {
  const [dataList, setDataList] = useState<SensorData[]>([]);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mqttConfig, setMqttConfig] = useState<MqttConfig>(config || getCurrentConfig());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const clientRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  // Manejar el ciclo de vida del componente
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      clearReconnectTimeout();
      if (clientRef.current) {
        try {
          clientRef.current.end();
        } catch (error) {
          console.error('Error cerrando cliente al desmontar:', error);
        }
      }
    };
  }, []);

  // Manejar el botón de retroceso en Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (connectionState === 'error') {
        // Si hay error, intentar reconectar al presionar retroceso
        setupMqttConnection();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [connectionState]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!isComponentMounted.current) return;
    
    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isComponentMounted.current) {
        console.log('Intentando reconexión programada...');
        setupMqttConnection();
      }
    }, 5000);
  }, []);

  const setupMqttConnection = useCallback(() => {
    if (!isComponentMounted.current) return;

    clearReconnectTimeout();
    setConnectionState('connecting');
    setErrorMessage(null);

    try {
      const client = getMqttClient();
      clientRef.current = client;

      const onConnect = () => {
        if (!isComponentMounted.current) return;
        console.log('Intentando conectar a:', mqttConfig.host, mqttConfig.port);
        
        client.subscribe(mqttConfig.topic, { qos: 0 }, (err) => {
          if (!isComponentMounted.current) return;
          
          if (err) {
            console.error('Error al suscribirse:', err);
            setErrorMessage('Error al suscribirse al servicio MQTT');
            setConnectionState('error');
            scheduleReconnect();
          } else {
            console.log('Suscripción exitosa');
            setConnectionState('connected');
            setErrorMessage(null);
          }
        });
      };

      const onMessage = (topic: string, message: Buffer) => {
        if (!isComponentMounted.current) return;
        
        if (topic === mqttConfig.topic) {
          try {
            const json: SensorData = JSON.parse(message.toString());
            const newEntry = { ...json, isNew: true };

            setDataList(prev => {
              const newList = [...prev, newEntry].sort((a, b) => {
                if (a.isNew && !b.isNew) return -1;
                if (!a.isNew && b.isNew) return 1;
                return new Date(b.time).getTime() - new Date(a.time).getTime();
              });
              
              AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
                .catch(err => console.error('Error guardando en memoria:', err));

              return newList;
            });
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      };

      const onError = (err: Error) => {
        if (!isComponentMounted.current) return;
        console.error('Error MQTT:', err);
        setErrorMessage('Error de conexión, reconectando...');
        setConnectionState('error');
        scheduleReconnect();
      };

      const onClose = () => {
        if (!isComponentMounted.current) return;
        console.log('Conexión MQTT cerrada');
        setConnectionState('reconnecting');
        setErrorMessage('Conexión cerrada, reconectando...');
        scheduleReconnect();
      };

      client.removeAllListeners();
      client.on('connect', onConnect);
      client.on('message', onMessage);
      client.on('error', onError);
      client.on('close', onClose);

    } catch (error) {
      console.error('Error en setupMqttConnection:', error);
      if (isComponentMounted.current) {
        setErrorMessage('Error al establecer conexión');
        setConnectionState('error');
        scheduleReconnect();
      }
    }
  }, [mqttConfig, scheduleReconnect]);

  // Actualizar configuración cuando cambia la prop
  useEffect(() => {
    if (config && isComponentMounted.current) {
      console.log('Actualizando configuración desde props:', config);
      setMqttConfig(config);
      updateMqttConfig(config);
    }
  }, [config]);

  // Cargar configuración inicial si no hay prop
  useEffect(() => {
    if (!config && isComponentMounted.current) {
      const loadInitialConfig = async () => {
        try {
          const initialConfig = await loadMqttConfig();
          console.log('Cargando configuración inicial:', initialConfig);
          if (isComponentMounted.current) {
            setMqttConfig(initialConfig);
            initializeMqttClient(initialConfig);
          }
        } catch (error) {
          console.error('Error cargando configuración inicial:', error);
          if (isComponentMounted.current) {
            setErrorMessage('Error al cargar la configuración inicial');
            setConnectionState('error');
          }
        }
      };
      loadInitialConfig();
    }
  }, [config]);

  // MQTT conexión y suscripción
  useEffect(() => {
    if (isComponentMounted.current) {
      setupMqttConnection();
    }
    return () => {
      clearReconnectTimeout();
      if (clientRef.current) {
        try {
          clientRef.current.removeAllListeners();
        } catch (error) {
          console.error('Error limpiando listeners:', error);
        }
      }
    };
  }, [mqttConfig, setupMqttConnection]);

  const updateMqttConfig = useCallback((newConfig: MqttConfig) => {
    if (!isComponentMounted.current) return;
    
    console.log('Actualizando configuración MQTT:', newConfig);
    setMqttConfig(newConfig);
    clearReconnectTimeout();
    
    if (clientRef.current) {
      try {
        clientRef.current.end();
      } catch (error) {
        console.error('Error cerrando cliente anterior:', error);
      }
    }
    
    initializeMqttClient(newConfig);
  }, []);

  const clearAllNotifications = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setDataList([]);
    } catch (error) {
      console.error('Error al eliminar notificaciones:', error);
    }
  };

  const handlePress = (index: number) => {
    setDataList(prev => {
      const updated = [...prev];
      updated[index].isNew = false;

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(err =>
        console.error('Error actualizando memoria:', err)
      );

      return updated;
    });
  };

  const renderItem = ({ item, index }: { item: SensorData; index: number }) => {
    const dateObj = new Date(item.time);

    return (
      <Pressable onPress={() => handlePress(index)}>
        <View style={styles.card}>
          {item.isNew && <Text style={styles.newAlert}>¡Nueva alerta!</Text>}
          <Text style={styles.title}>Sensor: {item.sensor}</Text>
          <Text style={styles.value}>Mensaje: {item.message}</Text>
          <Text style={styles.value}>Fecha: {dateObj.toLocaleDateString()}</Text>
          <Text style={styles.value}>Hora: {dateObj.toLocaleTimeString()}</Text>
          <Text style={styles.value}>Ubicación: {item.location}</Text>
          <Text style={styles.value}>Valor: {item.value} °C</Text>
        </View>
      </Pressable>
    );
  };

  const getStatusMessage = () => {
    switch (connectionState) {
      case 'connecting':
        return '🔌 Conectando al servicio...';
      case 'connected':
        return 'Esperando alertas del servidor...';
      case 'reconnecting':
        return 'Reconectando...';
      case 'error':
        return 'Error de conexión, reconectando...';
      default:
        return 'Conectando...';
    }
  };

  return (
    <View style={styles.container}>
      {dataList.length > 0 && (
        <View style={styles.buttonContainer}>
          <Button
            title="Eliminar notificaciones"
            onPress={clearAllNotifications}
          />
        </View>
      )}
      <FlatList
        data={dataList}
        keyExtractor={(item, index) => `${item.time}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {getStatusMessage()}
            </Text>
            <Text style={styles.configText}>
              Host: {mqttConfig.host}:{mqttConfig.port}
            </Text>
            <Text style={styles.configText}>
              Topic: {mqttConfig.topic}
            </Text>
            {errorMessage && (
              <Text style={[styles.configText, styles.errorText]}>
                {errorMessage}
              </Text>
            )}
            <ActivityIndicator 
              size="large" 
              color={connectionState === 'error' ? '#ff4444' : '#888'} 
              style={styles.loader} 
            />
            {connectionState === 'error' && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => setupMqttConnection()}
              >
                <Text style={styles.retryButtonText}>Reintentar conexión</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newAlert: {
    color: '#d00',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
  },
  actions: {
    flex: 1,
    marginBottom: 16,
  },
  buttonContainer: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: 16,
  },
  errorText: {
    color: '#ff4444',
    marginTop: 10,
    fontStyle: 'italic',
  },
  loader: {
    marginTop: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    minHeight: 200,
    backgroundColor: '#fff',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
