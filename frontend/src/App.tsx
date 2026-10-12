import React, { useState, useEffect, useCallback } from 'react';
import { grpcService } from './services/grpcService';
import type { ConnectionStatus, LogEntry, EventType, RpcType } from './types/sensor';
import { Header } from './components/Header';
import { SensorOverview } from './components/SensorOverview';
import { TemperatureChart } from './components/TemperatureChart';
import type { DataPoint } from './components/TemperatureChart';
import { RpcDemoPanel } from './components/RpcDemoPanel';
import { ActivityLog } from './components/ActivityLog';

export const App: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<string>('CHỜ KẾT NỐI');
  const [sensorId, setSensorId] = useState<string>('SENSOR-HVAC-01');
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Thêm sự kiện vào nhật ký (tối đa 80 dòng trong RAM)
  const addLog = useCallback(
    (type: EventType, rpcType: RpcType, message: string, status: 'success' | 'warning' | 'error' | 'info') => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
      const newEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        type,
        rpcType,
        message,
        status,
      };

      setLogs((prev) => [newEntry, ...prev.slice(0, 79)]);
      setLastUpdate(timeStr);
    },
    []
  );

  // Xử lý khi có gói tin đo nhiệt độ mới tới từ bất kỳ luồng nào
  const handleDataReceived = useCallback(
    (temp: number, timeStr: string, status: string, sId: string) => {
      setCurrentTemp(temp);
      setSensorStatus(status);
      setSensorId(sId);
      setTotalRecords((prev) => prev + 1);

      const timeLabel = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
      setChartData((prev) => [...prev.slice(-30), { time: timeLabel, temperature: temp }]);
    },
    []
  );

  const handleAlertTriggered = useCallback(() => {
    setAlertCount((prev) => prev + 1);
  }, []);

  const handleClearChart = useCallback(() => {
    setChartData([]);
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleReconnect = useCallback(() => {
    addLog('RPC_STARTED', 'SYSTEM', 'Đang kết nối lại đến gRPC Gateway...', 'info');
    grpcService.connect();
  }, [addLog]);

  // Khởi tạo kết nối gRPC Gateway khi mở Dashboard
  useEffect(() => {
    grpcService.connect();

    const unsubscribeStatus = grpcService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'CONNECTED') {
        addLog('RPC_STARTED', 'SYSTEM', 'Đã thiết lập kết nối WebSocket tới Gateway (port 8080)', 'success');
        setSensorStatus('BÌNH THƯỜNG');

        // Tự động kéo dữ liệu ban đầu từ Backend thật qua REST để hiển thị ban đầu
        grpcService
          .fetchUnaryRest('SENSOR-HVAC-01')
          .then((res) => {
            if (res && res.temperature) {
              handleDataReceived(res.temperature, res.timestamp, res.status, res.sensorId);
              addLog('MESSAGE_RECEIVED', 'UNARY', `Nạp dữ liệu cảm biến khởi tạo: ${res.temperature}°C`, 'info');
            }
          })
          .catch((err) => {
            console.warn('Chưa nạp được dữ liệu khởi tạo:', err);
          });
      } else if (status === 'DISCONNECTED') {
        addLog('RPC_ERROR', 'SYSTEM', 'Mất kết nối tới Gateway Backend. Đang tự động kết nối lại...', 'warning');
      }
    });

    return () => {
      unsubscribeStatus();
      grpcService.disconnect();
    };
  }, [addLog, handleDataReceived]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* 1. Header */}
      <Header
        status={connectionStatus}
        lastUpdate={lastUpdate}
        onReconnect={handleReconnect}
      />

      {/* 2. Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner cảnh báo nếu chưa chạy Backend */}
        {connectionStatus === 'DISCONNECTED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 text-xs text-rose-800">
            <div>
              <span className="font-bold">Chưa kết nối Backend!</span> Vui lòng đảm bảo bạn đã khởi động:
              <ol className="list-decimal list-inside mt-1 font-mono text-[11px] space-y-0.5 text-rose-900">
                <li>gRPC Server: <code className="bg-rose-100 px-1 py-0.5 rounded">mvn exec:java -Dexec.mainClass="com.example.grpc.SensorServer"</code> (Port 50051)</li>
                <li>Gateway Bridge: <code className="bg-rose-100 px-1 py-0.5 rounded">mvn exec:java -Dexec.mainClass="com.example.grpc.SensorGateway"</code> (Port 8080)</li>
              </ol>
            </div>
            <button
              onClick={handleReconnect}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer shadow-xs"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 2.1. Sensor Overview (4 cards) */}
        <section>
          <SensorOverview
            currentTemp={currentTemp}
            status={sensorStatus}
            totalRecords={totalRecords}
            alertCount={alertCount}
            sensorId={sensorId}
          />
        </section>

        {/* 2.2. Biểu đồ nhiệt độ */}
        <section>
          <TemperatureChart
            data={chartData}
            onClear={handleClearChart}
          />
        </section>

        {/* 2.3. Khu vực Demo gRPC (4 Tabs) */}
        <section>
          <RpcDemoPanel
            onAddLog={addLog}
            onDataReceived={handleDataReceived}
            onAlertTriggered={handleAlertTriggered}
            isConnected={connectionStatus === 'CONNECTED'}
          />
        </section>

        {/* 2.4. Activity Log */}
        <section>
          <ActivityLog
            logs={logs}
            onClear={handleClearLogs}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        Demo gRPC Streaming System &bull; Java Backend (Netty / HTTP/2) &bull; React TypeScript Frontend
      </footer>
    </div>
  );
};

export default App;
