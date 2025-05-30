//App.tsx
import React, { useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  Text,
  SafeAreaView,
  Platform,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Sensor from './mqttSubs';
import MqttConfigModal from './MqttConfigModal';
import { MqttConfig, loadMqttConfig } from './mqttConfig';

function App(): React.JSX.Element {
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<MqttConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración inicial
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await loadMqttConfig();
        setCurrentConfig(config);
      } catch (error) {
        console.error('Error cargando configuración inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleConfigChange = useCallback(async (newConfig: MqttConfig) => {
    console.log('Nueva configuración recibida:', newConfig);
    setCurrentConfig(newConfig);
    setIsConfigModalVisible(false);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Alertas del Sistema de Invernadero
          </Text>
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => setIsConfigModalVisible(true)}
          >
            <Text style={styles.configButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <Sensor 
          key={currentConfig ? `${currentConfig.host}-${currentConfig.port}-${currentConfig.topic}` : 'default'} 
          config={currentConfig || undefined}
        />
      </View>

      <MqttConfigModal
        visible={isConfigModalVisible}
        onClose={() => setIsConfigModalVisible(false)}
        onConfigChange={handleConfigChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    paddingTop: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  configButton: {
    padding: 8,
    marginLeft: 8,
  },
  configButtonText: {
    fontSize: 24,
  },
});

export default App;
