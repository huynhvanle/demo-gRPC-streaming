import type { ConnectionStatus } from '../types/sensor';

type MessageHandler = (data: any) => void;
type StatusHandler = (status: ConnectionStatus) => void;

class GrpcService {
  private ws: WebSocket | null = null;
  private wsUrl: string = 'ws://localhost:8080/ws/sensor';
  private httpUrl: string = 'http://localhost:8080';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectTimer: any = null;
  private shouldReconnect: boolean = true;
  private currentStatus: ConnectionStatus = 'DISCONNECTED';

  constructor() {
    // Tự động suy ra port nếu đang chạy qua proxy hoặc hostname khác
    const loc = window.location;
    if (loc.hostname) {
      this.wsUrl = `ws://${loc.hostname}:8080/ws/sensor`;
      this.httpUrl = `http://${loc.hostname}:8080`;
    }
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus('CONNECTING');
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.updateStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(message));
        } catch (err) {
          console.error('[GrpcService] Loi parse JSON:', err);
        }
      };

      this.ws.onclose = () => {
        this.updateStatus('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[GrpcService] Loi WebSocket:', err);
        this.updateStatus('DISCONNECTED');
      };
    } catch (e) {
      this.updateStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('DISCONNECTED');
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private updateStatus(status: ConnectionStatus): void {
    this.currentStatus = status;
    this.statusHandlers.forEach(handler => handler(status));
  }

  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.currentStatus);
    return () => this.statusHandlers.delete(handler);
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private send(action: string, payload: Record<string, any> = {}): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify({ action, ...payload }));
    return true;
  }

  // --- REST APIS ---
  public async checkHealth(): Promise<{ status: string; grpcTarget: string }> {
    const res = await fetch(`${this.httpUrl}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  public async fetchUnaryRest(sensorId: string): Promise<any> {
    const res = await fetch(`${this.httpUrl}/api/sensor/current?id=${encodeURIComponent(sensorId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // --- WEBSOCKET RPC APIS ---
  // 1. Unary RPC
  public sendUnary(sensorId: string): boolean {
    return this.send('UNARY', { sensorId });
  }

  // 2. Server Streaming RPC
  public startServerStream(sensorId: string, duration: number = 8): boolean {
    return this.send('START_SERVER_STREAM', { sensorId, duration });
  }

  public stopServerStream(): boolean {
    return this.send('STOP_SERVER_STREAM');
  }

  // 3. Client Streaming RPC
  public startClientStream(sensorId: string): boolean {
    return this.send('START_CLIENT_STREAM', { sensorId });
  }

  public sendClientStreamRecord(sensorId: string, temperature: number): boolean {
    return this.send('SEND_CLIENT_STREAM_RECORD', { sensorId, temperature });
  }

  public finishClientStream(): boolean {
    return this.send('FINISH_CLIENT_STREAM');
  }

  // 4. Bidirectional Streaming RPC
  public startBidiStream(sensorId: string): boolean {
    return this.send('START_BIDI_STREAM', { sensorId });
  }

  public sendBidiRecord(sensorId: string, temperature: number): boolean {
    return this.send('SEND_BIDI_RECORD', { sensorId, temperature });
  }

  public stopBidiStream(): boolean {
    return this.send('STOP_BIDI_STREAM');
  }
}

export const grpcService = new GrpcService();
