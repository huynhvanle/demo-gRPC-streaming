import React, { useState } from 'react';
import { grpcService } from '../services/grpcService';
import type { UnaryResponse } from '../types/sensor';
import { Send, Clock, ArrowRight } from 'lucide-react';

interface UnaryTabProps {
  onAddLog: (type: any, rpc: any, msg: string, status: any) => void;
  onDataReceived: (temp: number, time: string, status: string, sensorId: string) => void;
  isConnected: boolean;
}

export const UnaryTab: React.FC<UnaryTabProps> = ({ onAddLog, onDataReceived, isConnected }) => {
  const [sensorId, setSensorId] = useState('SENSOR-HVAC-01');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<UnaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!isConnected) {
      setError('Chưa kết nối đến Backend Gateway!');
      return;
    }

    setIsLoading(true);
    setError(null);
    onAddLog('RPC_STARTED', 'UNARY', `Gửi Unary Request: GetCurrentTemperature cho ${sensorId}`, 'info');

    try {
      // Gọi qua REST hoặc WebSocket
      const res = await grpcService.fetchUnaryRest(sensorId);
      const unaryRes: UnaryResponse = {
        data: {
          sensorId: res.sensorId,
          temperature: res.temperature,
          timestamp: res.timestamp,
          status: res.status,
        },
        latencyMs: res.latencyMs || 15,
      };

      setResponse(unaryRes);
      onDataReceived(unaryRes.data.temperature, unaryRes.data.timestamp, unaryRes.data.status, unaryRes.data.sensorId);
      onAddLog(
        'MESSAGE_RECEIVED',
        'UNARY',
        `Nhận 1 Response duy nhất: ${unaryRes.data.temperature}°C (${unaryRes.latencyMs}ms)`,
        'success'
      );
    } catch (err: any) {
      const msg = err.message || 'Lỗi gọi Unary RPC';
      setError(msg);
      onAddLog('RPC_ERROR', 'UNARY', `Unary RPC thất bại: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Cơ chế Unary RPC:</span> Client gửi đúng{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-blue-700">1 Request</code> và Server trả về đúng{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-blue-700">1 Response</code> duy nhất rồi đóng kết nối. Tương tự REST truyền thống nhưng truyền tải qua Protobuf nhị phân.
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mã cảm biến (Sensor ID)</label>
          <input
            type="text"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="vd: SENSOR-HVAC-01"
          />
        </div>
        <button
          onClick={handleExecute}
          disabled={isLoading || !isConnected}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Đang gọi gRPC...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Get Current Temperature</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Hiển thị Request và Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {/* Request Card */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Client Request (Protobuf Message)</span>
            <span className="font-mono text-blue-600 font-medium">SensorRequest</span>
          </div>
          <pre className="text-xs bg-slate-900 text-slate-100 p-2.5 rounded font-mono overflow-x-auto">
{`{
  "sensor_id": "${sensorId}"
}`}
          </pre>
        </div>

        {/* Response Card */}
        <div className="border border-slate-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Server Response (Protobuf Message)</span>
            {response && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono">
                <Clock className="w-3 h-3" /> {response.latencyMs}ms
              </span>
            )}
          </div>
          {response ? (
            <pre className="text-xs bg-slate-900 text-emerald-400 p-2.5 rounded font-mono overflow-x-auto">
{JSON.stringify(response.data, null, 2)}
            </pre>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded">
              Chưa gửi request
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
