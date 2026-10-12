import React, { useState, useEffect } from 'react';
import { grpcService } from '../services/grpcService';
import type { SensorSummary } from '../types/sensor';
import { ArrowUp, Upload, CheckCircle2, RefreshCw } from 'lucide-react';

interface ClientStreamTabProps {
  onAddLog: (type: any, rpc: any, msg: string, status: any) => void;
  onDataReceived: (temp: number, time: string, status: string, sensorId: string) => void;
  isConnected: boolean;
}

export const ClientStreamTab: React.FC<ClientStreamTabProps> = ({
  onAddLog,
  onDataReceived,
  isConnected,
}) => {
  const [sensorId, setSensorId] = useState('SENSOR-FACTORY-99');
  // Mẫu các điểm nhiệt độ gửi lên
  const [readings, setReadings] = useState<number[]>([26.2, 27.5, 29.8, 32.1, 35.4, 28.0]);
  const [customTemp, setCustomTemp] = useState('30.0');
  const [sentCount, setSentCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [summary, setSummary] = useState<SensorSummary | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Sẵn sàng');

  useEffect(() => {
    const unsubscribe = grpcService.onMessage((msg) => {
      if (msg.type === 'CLIENT_STREAM_SUMMARY') {
        const sum: SensorSummary = msg.data;
        setSummary(sum);
        setIsSending(false);
        setStatusMessage('Đã nhận kết quả tổng kết từ Server!');
        onAddLog(
          'MESSAGE_RECEIVED',
          'CLIENT_STREAM',
          `Server phản hồi SensorSummary: ${sum.totalRecords} bản ghi, TB: ${sum.averageTemperature}°C, Min: ${sum.minTemperature}°C, Max: ${sum.maxTemperature}°C`,
          'success'
        );
      } else if (msg.type === 'CLIENT_STREAM_ERROR') {
        setIsSending(false);
        setStatusMessage('Lỗi stream!');
        onAddLog('RPC_ERROR', 'CLIENT_STREAM', `Lỗi Client Streaming: ${msg.error}`, 'error');
      }
    });

    return () => unsubscribe();
  }, [onAddLog]);

  // Sinh ngẫu nhiên một mảng 6-8 điểm đo
  const handleGenerateSample = () => {
    const samples = [
      Math.round((24 + Math.random() * 8) * 10) / 10,
      Math.round((26 + Math.random() * 8) * 10) / 10,
      Math.round((28 + Math.random() * 8) * 10) / 10,
      Math.round((30 + Math.random() * 9) * 10) / 10,
      Math.round((32 + Math.random() * 6) * 10) / 10,
      Math.round((27 + Math.random() * 5) * 10) / 10,
    ];
    setReadings(samples);
  };

  const handleAddTemp = () => {
    const val = parseFloat(customTemp);
    if (!isNaN(val)) {
      setReadings((prev) => [...prev, val]);
      setCustomTemp('30.0');
    }
  };

  // Tự động stream toàn bộ mảng dữ liệu với khoảng cách 500ms
  const handleStartAndSendBatch = async () => {
    if (!isConnected || readings.length === 0) return;

    setSummary(null);
    setSentCount(0);
    setIsSending(true);
    setStatusMessage('Đang kết nối luồng Client Streaming...');

    onAddLog('RPC_STARTED', 'CLIENT_STREAM', `Bắt đầu Client Stream: Gửi ${readings.length} bản ghi cho ${sensorId}`, 'info');

    // 1. Mở luồng Client Stream
    grpcService.startClientStream(sensorId);

    // Đợi 200ms để Gateway khởi tạo stream
    await new Promise((r) => setTimeout(r, 200));

    // 2. Gửi từng bản ghi
    for (let i = 0; i < readings.length; i++) {
      const temp = readings[i];
      grpcService.sendClientStreamRecord(sensorId, temp);
      setSentCount(i + 1);
      setStatusMessage(`Đang gửi bản ghi #${i + 1}/${readings.length} (${temp}°C)...`);
      onDataReceived(temp, new Date().toLocaleTimeString('vi-VN'), 'UPLOAD', sensorId);

      onAddLog('MESSAGE_RECEIVED', 'CLIENT_STREAM', `Đã đẩy bản ghi #${i + 1}: ${temp}°C`, 'info');
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. Kết thúc gửi luồng (onCompleted)
    setStatusMessage('Đã gửi xong! Đang gọi onCompleted() để Server tổng kết...');
    onAddLog('STREAM_COMPLETED', 'CLIENT_STREAM', 'Client đã hoàn tất gửi (gọi onCompleted). Đợi Server tính toán...', 'info');
    grpcService.finishClientStream();
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <ArrowUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Cơ chế Client Streaming:</span> Client liên tục gửi các gói tin{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-emerald-700">stream SensorData</code> lên Server. Sau khi Client gọi{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-emerald-700">onCompleted()</code>, Server mới tính toán thống kê (Tổng, TB, Max, Min) và trả về duy nhất{' '}
          <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-emerald-700">1 SensorSummary</code>.
        </div>
      </div>

      {/* Cấu hình Sensor ID & dữ liệu đầu vào */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mã cảm biến (Sensor ID)</label>
          <input
            type="text"
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            disabled={isSending}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100"
          />

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Tập dữ liệu sẽ stream ({readings.length} mẫu)</label>
              <button
                onClick={handleGenerateSample}
                disabled={isSending}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Sinh mẫu mới
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[42px]">
              {readings.map((t, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                    isSending && idx < sentCount
                      ? 'bg-emerald-600 text-white'
                      : isSending && idx === sentCount
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  {t.toFixed(1)}°C
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              step="0.5"
              value={customTemp}
              onChange={(e) => setCustomTemp(e.target.value)}
              disabled={isSending}
              className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
              placeholder="30.0"
            />
            <button
              onClick={handleAddTemp}
              disabled={isSending}
              className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg cursor-pointer"
            >
              + Thêm điểm đo
            </button>
          </div>
        </div>

        {/* Nút thực hiện và trạng thái */}
        <div className="flex flex-col justify-between border border-slate-200 rounded-lg p-3 bg-white">
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Trạng thái gửi luồng</div>
            <p className="text-xs text-slate-500 mb-3">{statusMessage}</p>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 transition-all duration-300"
                style={{ width: `${readings.length > 0 ? (sentCount / readings.length) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Đã gửi: {sentCount} / {readings.length}</span>
              <span>{readings.length > 0 ? Math.round((sentCount / readings.length) * 100) : 0}%</span>
            </div>
          </div>

          <button
            onClick={handleStartAndSendBatch}
            disabled={isSending || !isConnected || readings.length === 0}
            className="w-full mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang stream dữ liệu lên Server...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Bắt đầu Upload Stream ({readings.length} bản ghi)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hiển thị kết quả SensorSummary từ Server */}
      {summary && (
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KẾT QUẢ TỔNG HỢP TỪ SERVER (SensorSummary Protobuf Response)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-400 block text-[11px]">Tổng bản ghi</span>
              <span className="text-lg font-bold font-mono text-slate-800">{summary.totalRecords}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-400 block text-[11px]">Nhiệt độ TB</span>
              <span className="text-lg font-bold font-mono text-blue-600">{summary.averageTemperature}°C</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-400 block text-[11px]">Nhiệt độ Max</span>
              <span className="text-lg font-bold font-mono text-rose-600">{summary.maxTemperature}°C</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <span className="text-slate-400 block text-[11px]">Nhiệt độ Min</span>
              <span className="text-lg font-bold font-mono text-emerald-600">{summary.minTemperature}°C</span>
            </div>
          </div>
          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-emerald-200 font-medium">
            Đánh giá từ server: <span className="text-emerald-900">{summary.summaryMessage}</span>
          </p>
        </div>
      )}
    </div>
  );
};
