import React, { useState, useEffect, useRef } from 'react';
import { grpcService } from '../services/grpcService';
import type { SensorAlert } from '../types/sensor';
import { Repeat, Play, Square, Send, AlertTriangle, ShieldCheck, Flame, Radio } from 'lucide-react';

interface SentItem {
  id: number;
  sensorId: string;
  temperature: number;
  timestamp: string;
}

interface BidiStreamTabProps {
  onAddLog: (type: any, rpc: any, msg: string, status: any) => void;
  onDataReceived: (temp: number, time: string, status: string, sensorId: string) => void;
  onAlertTriggered: () => void;
  isConnected: boolean;
}

export const BidiStreamTab: React.FC<BidiStreamTabProps> = ({
  onAddLog,
  onDataReceived,
  onAlertTriggered,
  isConnected,
}) => {
  const [sensorId, setSensorId] = useState('SENSOR-BOILER-07');
  const [isActive, setIsActive] = useState(false);
  const [autoStream, setAutoStream] = useState(false);
  const [currentInputTemp, setCurrentInputTemp] = useState('30.0');

  const [sentList, setSentList] = useState<SentItem[]>([]);
  const [receivedAlerts, setReceivedAlerts] = useState<SensorAlert[]>([]);

  const autoStreamIntervalRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = grpcService.onMessage((msg) => {
      if (msg.type === 'BIDI_ALERT') {
        const alert: SensorAlert = msg.data;
        setReceivedAlerts((prev) => [alert, ...prev]);
        onDataReceived(alert.temperature, alert.timestamp, alert.alertLevel, alert.sensorId);

        if (alert.alertLevel !== 'NORMAL') {
          onAlertTriggered();
        }

        const logStatus = alert.alertLevel === 'CRITICAL' ? 'error' : alert.alertLevel === 'WARNING' ? 'warning' : 'info';
        onAddLog('MESSAGE_RECEIVED', 'BIDI_STREAM', `[Alert ${alert.alertLevel}] ${alert.alertMessage}`, logStatus);
      } else if (msg.type === 'BIDI_SERVER_COMPLETED') {
        setIsActive(false);
        setAutoStream(false);
        onAddLog('STREAM_COMPLETED', 'BIDI_STREAM', 'Server đã đóng luồng phản hồi Bidirectional', 'success');
      } else if (msg.type === 'BIDI_ERROR') {
        setIsActive(false);
        setAutoStream(false);
        onAddLog('RPC_ERROR', 'BIDI_STREAM', `Lỗi kênh Bidirectional: ${msg.error}`, 'error');
      }
    });

    return () => unsubscribe();
  }, [onAddLog, onDataReceived, onAlertTriggered]);

  // Xử lý auto-stream định kỳ 1 giây gửi 1 bản ghi
  useEffect(() => {
    if (autoStream && isActive) {
      autoStreamIntervalRef.current = setInterval(() => {
        // Sinh nhiệt độ biến thiên có lúc bình thường, có lúc vượt ngưỡng
        const temps = [27.0, 29.5, 33.2, 38.6, 41.5, 30.0, 34.0, 26.5];
        const nextTemp = temps[Math.floor(Math.random() * temps.length)];
        sendTemperature(nextTemp);
      }, 1000);
    } else {
      if (autoStreamIntervalRef.current) {
        clearInterval(autoStreamIntervalRef.current);
        autoStreamIntervalRef.current = null;
      }
    }

    return () => {
      if (autoStreamIntervalRef.current) {
        clearInterval(autoStreamIntervalRef.current);
      }
    };
  }, [autoStream, isActive, sensorId]);

  const handleStartSession = () => {
    if (!isConnected) return;
    setSentList([]);
    setReceivedAlerts([]);
    setIsActive(true);
    onAddLog('RPC_STARTED', 'BIDI_STREAM', `Mở kênh Bidirectional Streaming độc lập 2 chiều cho ${sensorId}`, 'info');
    grpcService.startBidiStream(sensorId);
  };

  const handleStopSession = () => {
    setAutoStream(false);
    setIsActive(false);
    grpcService.stopBidiStream();
    onAddLog('STREAM_COMPLETED', 'BIDI_STREAM', 'Đã đóng kênh Bidirectional', 'warning');
  };

  const sendTemperature = (temp: number) => {
    if (!isActive) return;
    const now = new Date().toLocaleTimeString('vi-VN');
    grpcService.sendBidiRecord(sensorId, temp);
    setSentList((prev) => [
      { id: Date.now() + Math.random(), sensorId, temperature: temp, timestamp: now },
      ...prev,
    ]);
    onAddLog('MESSAGE_RECEIVED', 'BIDI_STREAM', `[Client Gửi] ${temp}°C lên Server`, 'info');
  };

  const handleManualSend = () => {
    const val = parseFloat(currentInputTemp);
    if (!isNaN(val)) {
      sendTemperature(val);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <Repeat className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Cơ chế Bidirectional Streaming (Song công 2 chiều):</span>{' '}
          Client liên tục gửi <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-purple-700">stream SensorData</code> và Server đồng thời phản hồi{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-purple-700">stream SensorAlert</code> hoàn toàn độc lập, không bắt buộc 1 request phải chờ 1 response tuần tự.
        </div>
      </div>

      {/* Thanh điều khiển phiên */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="w-48">
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Mã cảm biến</label>
            <input
              type="text"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              disabled={isActive}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono disabled:bg-slate-100"
            />
          </div>

          {!isActive ? (
            <button
              onClick={handleStartSession}
              disabled={!isConnected}
              className="mt-4 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Mở phiên 2 chiều</span>
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              className="mt-4 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Đóng phiên Stream</span>
            </button>
          )}
        </div>

        {isActive && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStream}
                onChange={(e) => setAutoStream(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <Radio className={`w-3.5 h-3.5 ${autoStream ? 'text-purple-600 animate-pulse' : 'text-slate-400'}`} />
              <span>Tự động đẩy mẫu (1s/lần)</span>
            </label>
          </div>
        )}
      </div>

      {/* Điều khiển đẩy dữ liệu thủ công khi stream active */}
      {isActive && (
        <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
          <div className="text-xs font-semibold text-purple-900">Bắn dữ liệu nhiệt độ tức thì lên Server:</div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick inject buttons */}
            <button
              onClick={() => sendTemperature(27.0)}
              className="px-2.5 py-1 text-xs rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> 27.0°C (Bình thường)
            </button>
            <button
              onClick={() => sendTemperature(33.5)}
              className="px-2.5 py-1 text-xs rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" /> 33.5°C (Cảnh báo &ge;32)
            </button>
            <button
              onClick={() => sendTemperature(41.0)}
              className="px-2.5 py-1 text-xs rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3 h-3 text-rose-600" /> 41.0°C (Nguy hiểm &ge;38)
            </button>

            <span className="text-slate-300">|</span>

            {/* Tùy chỉnh nhiệt độ */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                value={currentInputTemp}
                onChange={(e) => setCurrentInputTemp(e.target.value)}
                className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
              />
              <button
                onClick={handleManualSend}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" /> Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2 Cột hiển thị luồng độc lập: Gửi đi vs Nhận về */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CỘT 1: CLIENT GỬI LÊN */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>Client Stream (Dữ liệu gửi đi)</span>
            <span className="text-slate-500 font-mono font-medium">{sentList.length} bản ghi</span>
          </div>
          <div className="h-56 overflow-y-auto divide-y divide-slate-100">
            {sentList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {isActive ? 'Bấm các nút phía trên để bắn dữ liệu...' : 'Chưa mở phiên stream.'}
              </div>
            ) : (
              sentList.map((item, idx) => (
                <div key={item.id} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-mono">#{sentList.length - idx}</span>
                    <span className="font-bold text-purple-700 font-mono">{item.temperature.toFixed(1)}°C</span>
                    <span className="text-slate-500 font-mono text-[10px]">[{item.sensorId}]</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT 2: SERVER BẮN PHẢN HỒI VỀ */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>Server Stream (Cảnh báo thời gian thực)</span>
            <span className="text-slate-500 font-mono font-medium">{receivedAlerts.length} phản hồi</span>
          </div>
          <div className="h-56 overflow-y-auto divide-y divide-slate-100">
            {receivedAlerts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chờ phản hồi từ Server...
              </div>
            ) : (
              receivedAlerts.map((alert, idx) => {
                const isCrit = alert.alertLevel === 'CRITICAL';
                const isWarn = alert.alertLevel === 'WARNING';
                const badgeColor = isCrit
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isWarn
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                return (
                  <div key={idx} className="px-3 py-2 text-xs hover:bg-slate-50 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                        {alert.alertLevel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{alert.timestamp.split(' ')[1] || alert.timestamp}</span>
                    </div>
                    <p className="text-slate-800 text-xs font-medium">{alert.alertMessage}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
