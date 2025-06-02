import { Client } from 'paho-mqtt';

const client = new Client(
  '192.168.248.132', // IP de tu amigo o broker local
  9001,              // Puerto WebSocket
  'expo-client-' + new Date().getTime()
);

export default client;
