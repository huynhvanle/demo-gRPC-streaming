import React, { useState, useEffect } from 'react';
import { grpcService } from '../services/grpcService';
import type { SensorData } from '../types/sensor';
import { Play, Square, ArrowDown, Radio } from 'lucide-react';

interface ServerStreamTabProps {
  onAddLog: (type: any, rpc: any, msg: string, status: any) => void;
  onDataReceived: (temp: number, time: string, status: string, sensorId: string) => void;
  isConnected: boolean;
}

export const ServerStreamTab: React.FC<ServerStreamTabProps> = ({
  onAddLog,
  onDataReceived,
  isConnected,
}) => {
  const [sensorId, setSensorId] = useState('SENSOR-ROOM-102');
  const [duration, setDuration] = useState(6);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamRecords, setStreamRecords] = useState<SensorData[]>([]);
  const [streamStatus, setStreamStatus] = useState<'IDLE' | 'STREAMING' | 'COMPLETED' | 'STOPPED'>('IDLE');

  useEffect(() => {
    // Đăng ký nhận tin nhắn WebSocket
    const unsubscribe = grpcService.onMessage((msg) => {
      if (msg.type === 'SERVER_STREAM_RECORD') {
        const data: SensorData = msg.data;
        setStreamRecords((prev) => [data, ...prev]);
        onDataReceived(data.temperature, data.timestamp, data.status, data.sensorId);
        onAddLog(
          'MESSAGE_RECEIVED',
          'SERVER_STREAM',
          `[Stream Record] Nhiệt độ: ${data.temperature}°C lúc ${data.timestamp} (${data.status})`,
          'info'
        );
      } else if (msg.type === 'SERVER_STREAM_COMPLETED') {
        setIsStreaming(false);
        setStreamStatus('COMPLETED');
        onAddLog('STREAM_COMPLETED', 'SERVER_STREAM', 'Server đã hoàn tất stream (onCompleted)', 'success');
      } else if (msg.type === 'SERVER_STREAM_STOPPED') {
        setIsStreaming(false);
        setStreamStatus('STOPPED');
        onAddLog('STREAM_COMPLETED', 'SERVER_STREAM', 'Đã hủy luồng Server Streaming theo yêu cầu', 'warning');
      } else if (msg.type === 'SERVER_STREAM_ERROR') {
        setIsStreaming(false);
        setStreamStatus('STOPPED');
        onAddLog('RPC_ERROR', 'SERVER_STREAM', `Lỗi stream: ${msg.error}`, 'error');
      }
    });

    return () => unsubscribe();
  }, [onAddLog, onDataReceived]);

  const handleStart = () => {
    if (!isConnected) return;
    setStreamRecords([]);
    setIsStreaming(true);
    setStreamStatus('STREAMING');
    onAddLog(
      'RPC_STARTED',
      'SERVER_STREAM',
      `Khởi tạo Server Streaming: Theo dõi ${sensorId} trong ${duration} giây`,
      'info'
    );
    grpcService.startServerStream(sensorId, duration);
  };

  const handleStop = () => {
    grpcService.stopServerStream();
    setIsStreaming(false);
    setStreamStatus('STOPPED');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <ArrowDown className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Cơ chế Server Streaming:</span> Client gửi{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-indigo-700">1 SubscribeRequest</code>, Server mở một luồng HTTP/2 và liên tục bắn các gói tin{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-indigo-700">stream SensorData</code> theo chu kỳ 1 giây. Client hiển thị dữ liệu ngay khi nhận được qua callback <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">onNext()</code>.
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mã cảm biến</label>
          <input
            type="text"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            disabled={isStreaming}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng (giây)</label>
          <input
            type="number"
            min={2}
            max={30}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
            disabled={isStreaming}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100"
          />
        </div>

        {!isStreaming ? (
          <button
            onClick={handleStart}
            disabled={!isConnected}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Bắt đầu Server Stream</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Dừng Stream (Cancel)</span>
          </button>
        )}
      </div>

      {/* Trạng thái streaming và bộ đếm */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Trạng thái luồng:</span>
          {streamStatus === 'STREAMING' ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse text-indigo-600" /> Đang nhận stream...
            </span>
          ) : streamStatus === 'COMPLETED' ? (
            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Hoàn tất (Server onCompleted)
            </span>
          ) : streamStatus === 'STOPPED' ? (
            <span className="font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
              Đã dừng
            </span>
          ) : (
            <span className="text-slate-500 font-medium">Sẵn sàng</span>
          )}
        </div>
        <div className="font-mono text-slate-700 font-medium">
          Đã nhận: <span className="text-indigo-600 font-bold">{streamRecords.length}</span> bản ghi
        </div>
      </div>

      {/* Danh sách các bản ghi stream nhận được */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
          <span>Luồng dữ liệu nhận thời gian thực (Mới nhất ở trên)</span>
          <span className="text-[11px] text-slate-400 font-normal">HTTP/2 DATA frames</span>
        </div>
        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
          {streamRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isStreaming ? 'Đang đợi bản ghi đầu tiên từ Server...' : 'Chưa có bản ghi nào. Bấm "Bắt đầu" để test.'}
            </div>
          ) : (
            streamRecords.map((r, i) => (
              <div key={i} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono text-[11px] text-slate-400">#{streamRecords.length - i}</span>
                  <span className="font-semibold text-slate-900 font-mono">{r.temperature.toFixed(1)}°C</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {r.status}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">{r.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
