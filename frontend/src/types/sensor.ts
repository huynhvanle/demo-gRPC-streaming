export interface SensorData {
  sensorId: string;
  temperature: number;
  timestamp: string;
  status: string;
}

export interface SensorSummary {
  sensorId: string;
  totalRecords: number;
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  summaryMessage: string;
}

export interface SensorAlert {
  sensorId: string;
  temperature: number;
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  alertMessage: string;
  timestamp: string;
}

export interface UnaryResponse {
  data: SensorData;
  latencyMs: number;
}

export type EventType = 'RPC_STARTED' | 'MESSAGE_RECEIVED' | 'STREAM_COMPLETED' | 'RPC_ERROR';
export type RpcType = 'UNARY' | 'SERVER_STREAM' | 'CLIENT_STREAM' | 'BIDI_STREAM' | 'SYSTEM';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: EventType;
  rpcType: RpcType;
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
