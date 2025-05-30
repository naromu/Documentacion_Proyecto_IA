import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MqttConfig, loadMqttConfig, saveMqttConfig } from './mqttConfig';

interface MqttConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onConfigChange: (config: MqttConfig) => void;
}

export default function MqttConfigModal({ visible, onClose, onConfigChange }: MqttConfigModalProps) {
  const [config, setConfig] = useState<MqttConfig>({
    host: '',
    port: 0,
    topic: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStoredConfig();
    }
  }, [visible]);

  const loadStoredConfig = async () => {
    try {
      setIsLoading(true);
      const storedConfig = await loadMqttConfig();
      console.log('Configuración cargada:', storedConfig);
      setConfig(storedConfig);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración guardada');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const portNumber = parseInt(config.port.toString());
      
      if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
        Alert.alert('Error', 'El puerto debe ser un número válido entre 1 y 65535');
        return;
      }

      if (!config.host.trim()) {
        Alert.alert('Error', 'El host no puede estar vacío');
        return;
      }

      if (!config.topic.trim()) {
        Alert.alert('Error', 'El topic no puede estar vacío');
        return;
      }

      const newConfig = { ...config, port: portNumber };
      console.log('Guardando nueva configuración:', newConfig);
      
      await saveMqttConfig(newConfig);
      onConfigChange(newConfig);
      onClose();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Configuración MQTT</Text>
          
          <Text style={styles.label}>Host:</Text>
          <TextInput
            style={styles.input}
            value={config.host}
            onChangeText={(text) => setConfig({ ...config, host: text })}
            placeholder="Ej: 192.168.1.100"
            editable={!isLoading}
          />

          <Text style={styles.label}>Puerto:</Text>
          <TextInput
            style={styles.input}
            value={config.port.toString()}
            onChangeText={(text) => setConfig({ ...config, port: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="Ej: 9001"
            editable={!isLoading}
          />

          <Text style={styles.label}>Topic:</Text>
          <TextInput
            style={styles.input}
            value={config.topic}
            onChangeText={(text) => setConfig({ ...config, topic: text })}
            placeholder="Ej: alertapp/test"
            editable={!isLoading}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 