import React from 'react';
import { Thermometer, ShieldCheck, Database, AlertTriangle } from 'lucide-react';

interface SensorOverviewProps {
  currentTemp: number | null;
  status: string;
  totalRecords: number;
  alertCount: number;
  sensorId: string;
}

export const SensorOverview: React.FC<SensorOverviewProps> = ({
  currentTemp,
  status,
  totalRecords,
  alertCount,
  sensorId,
}) => {
  // Xác định màu trạng thái dựa trên status hoặc nhiệt độ
  const getStatusColor = () => {
    const s = status.toUpperCase();
    if (s.includes('CRITICAL') || s.includes('ERROR') || (currentTemp !== null && currentTemp >= 38.0)) {
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-600',
        label: 'Nguy hiểm',
      };
    }
    if (s.includes('WARM') || s.includes('WARNING') || (currentTemp !== null && currentTemp >= 32.0)) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-500',
        label: 'Cảnh báo',
      };
    }
    if (s.includes('NORMAL') || s.includes('ACTIVE') || s.includes('OK') || (currentTemp !== null && currentTemp > 0)) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-500',
        label: 'Bình thường',
      };
    }
    return {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      badge: 'bg-slate-400',
      label: 'Chờ dữ liệu',
    };
  };

  const statusStyle = getStatusColor();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Nhiệt độ hiện tại */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Nhiệt độ hiện tại</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentTemp !== null ? currentTemp.toFixed(1) : '--.-'}
          </span>
          <span className="text-base font-semibold text-slate-500">°C</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 truncate">
          Cảm biến: <span className="text-slate-600 font-mono font-medium">{sensorId || 'Chưa chọn'}</span>
        </p>
      </div>

      {/* 2. Trạng thái cảm biến */}
      <div className={`border rounded-xl p-4 shadow-xs transition-colors ${statusStyle.bg} ${statusStyle.border}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider ${statusStyle.text}`}>
            Trạng thái cảm biến
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-2xs">
            <ShieldCheck className={`w-4 h-4 ${statusStyle.text}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.badge}`}></span>
          <span className={`text-xl font-bold tracking-tight ${statusStyle.text}`}>
            {status || statusStyle.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 truncate">
          Đánh giá từ gRPC Backend logic
        </p>
      </div>

      {/* 3. Tổng bản ghi nhận được */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Bản ghi đã nhận</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalRecords}
          </span>
          <span className="text-xs text-slate-400">gói tin</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 truncate">
          Tích lũy từ các luồng streaming
        </p>
      </div>

      {/* 4. Số cảnh báo phát sinh */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Cảnh báo ghi nhận</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-extrabold tracking-tight ${alertCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {alertCount}
          </span>
          <span className="text-xs text-slate-400">lần vượt ngưỡng</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 truncate">
          Ngưỡng: &ge;32.0°C (Cảnh báo), &ge;38.0°C (Nguy hiểm)
        </p>
      </div>
    </div>
  );
};
