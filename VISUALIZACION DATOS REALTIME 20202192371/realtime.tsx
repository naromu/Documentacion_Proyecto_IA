import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from 'paho-mqtt';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import client from '../../mqttClient';


export default function RealTimeScreen() {
  const [temperaturaData, setTemperaturaData] = useState<number[]>([]);
  const [humedadData, setHumedadData] = useState<number[]>([]);
  const [estadoVentilador, setEstadoVentilador] = useState<string>('Desconocido');
  const [estadoBombillo, setEstadoBombillo] = useState<string>('Desconocido');
  const [labels, setLabels] = useState<string[]>([]);
  const [notificaciones, setNotificaciones] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const counter = useRef(1);

  useEffect(() => {
    client.connect({
      onSuccess: () => {
        console.log('✅ Conectado');
        setConnected(true);
        client.subscribe('sensor/temperatura');
        client.subscribe('sistema/notificaciones');
        client.subscribe('actuador/ventilador');
        client.subscribe('actuador/bombillo');

        client.onMessageArrived = (message: Message) => {
          const topic = message.destinationName;
          const payload = message.payloadString;

          console.log(' Mensaje recibido:', topic, payload);

          if (topic === 'sensor/temperatura') {
            try {
              const { temperature, humidity } = JSON.parse(payload);

              const temp = parseFloat(temperature);
              const hum = parseFloat(humidity);

              if (!isNaN(temp) && isFinite(temp)) {
                setTemperaturaData(prev => [...prev.slice(-9), temp]);
                console.log(` Temp: ${temp} °C`);
              }

              if (!isNaN(hum) && isFinite(hum)) {
                setHumedadData(prev => [...prev.slice(-9), hum]);
                console.log(` Hum: ${hum} %`);
              }

              setLabels(prev => [...prev.slice(-9), counter.current.toString()]);
              counter.current += 1;
            } catch (error) {
              console.error(' Error al parsear JSON:', payload);
            }
          }

          if (topic === 'sistema/notificaciones') {
            console.log(` Notificación recibida: ${payload}`);
            setNotificaciones(prev => [...prev.slice(-9), payload]);
          }
          if (topic === 'actuador/ventilador') {
            setEstadoVentilador(payload.trim());
            console.log(`🌀 Ventilador: ${payload}`);
          }

          if (topic === 'actuador/bombillo') {
            setEstadoBombillo(payload.trim());
            console.log(`💡 Bombillo: ${payload}`);
          }
        };
      },
      useSSL: false,
      onFailure: (e) => console.error(' Conexión fallida:', e),
    });

    return () => client.disconnect();
  }, []);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#f5f7fa',
    backgroundGradientTo: '#e2e8f0',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
    labelColor: () => '#333',
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#1e88e5' },
  };

  const chartWidth = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Visualización en Tiempo Real</Text>
      <Text style={[styles.status, { color: connected ? '#4CAF50' : '#F44336' }]}>
        Estado: {connected ? 'Conectado ✅' : 'Conectando...'}
      </Text>

      <Text style={styles.subtitle}> Temperatura (°C)</Text>
      <LineChart
        data={{
          labels: labels.length > 0 ? labels : ['0'],
          datasets: [{ data: temperaturaData.length > 0 ? temperaturaData : [0] }],
        }}
        width={chartWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      <Text style={styles.subtitle}> Humedad (%)</Text>
      <LineChart
        data={{
          labels: labels.length > 0 ? labels : ['0'],
          datasets: [{ data: humedadData.length > 0 ? humedadData : [0] }],
        }}
        width={chartWidth}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        }}
        bezier
        style={styles.chart}
      />

      <Text style={styles.subtitle}>🔔 Últimas notificaciones</Text>
      <View style={styles.notifications}>
        {notificaciones.length === 0 ? (
          <Text style={styles.empty}>No hay notificaciones aún.</Text>
        ) : (
          notificaciones.map((n, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardText}>🔔 {n}</Text>
            </View>
          ))
        )}
      </View>
      <Text style={styles.subtitle}>Estado de Actuadores</Text>
      <View style={styles.actuadores}>
      <View style={styles.estadoRow}>
        <MaterialCommunityIcons
          name="fan"
          size={24}
          color={estadoVentilador === 'ON' ? '#4CAF50' : '#F44336'}
        />
        <Text style={styles.estadoLabel}> Ventilador: </Text>
        <Text style={[styles.estadoValor, estadoVentilador === 'ON' ? styles.estadoOn : styles.estadoOff]}>
          {estadoVentilador}
        </Text>
      </View>

      <View style={styles.estadoRow}>
        <MaterialCommunityIcons
          name="lightbulb"
          size={24}
          color={estadoBombillo === 'ON' ? '#4CAF50' : '#F44336'}
        />
        <Text style={styles.estadoLabel}> Bombillo: </Text>
        <Text style={[styles.estadoValor, estadoBombillo === 'ON' ? styles.estadoOn : styles.estadoOff]}>
          {estadoBombillo}
        </Text>
      </View>
    </View>     
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f7fa', flexGrow: 1 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e88e5',
  },
  status: { fontSize: 16, fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, color: '#333' },
  chart: { marginVertical: 10, borderRadius: 12 },
  notifications: { marginTop: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: { fontSize: 16, color: '#333' },
  empty: { fontStyle: 'italic', color: '#666', textAlign: 'center' },
  actuadores: {
  marginTop: 20,
  paddingHorizontal: 8,
  },
  estadoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  estadoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  estadoOn: {
    color: '#4CAF50',
  },
  estadoOff: {
    color: '#F44336',
  },
  estadoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 12,
  }
});
