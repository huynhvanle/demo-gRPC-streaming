import React, { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../types/sensor';
import { Activity, RefreshCw, Server } from 'lucide-react';

interface HeaderProps {
  status: ConnectionStatus;
  lastUpdate: string;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, lastUpdate, onReconnect }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sensor Monitoring</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              gRPC v1.62
            </span>
          </div>
          <p className="text-xs text-slate-500">Real-time gRPC Streaming Demo (Unary, Server, Client, Bi-directional)</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {/* Backend status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600">gRPC Server :50051</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            {status === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium text-emerald-700">Đã kết nối</span>
              </>
            ) : status === 'CONNECTING' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="font-medium text-amber-700">Đang kết nối...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="font-medium text-rose-700">Mất kết nối</span>
              </>
            )}
          </div>
          {status === 'DISCONNECTED' && (
            <button
              onClick={onReconnect}
              title="Thử kết nối lại"
              className="ml-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Đồng hồ và cập nhật */}
        <div className="hidden sm:flex flex-col items-end text-slate-500">
          <div className="font-mono text-slate-800 font-medium">{currentTime}</div>
          <div className="text-[11px] text-slate-400">
            Cập nhật: {lastUpdate ? lastUpdate : 'Chưa có dữ liệu'}
          </div>
        </div>
      </div>
    </header>
  );
};
