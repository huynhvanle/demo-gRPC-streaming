import React, { useState } from 'react';
import { UnaryTab } from './UnaryTab';
import { ServerStreamTab } from './ServerStreamTab';
import { ClientStreamTab } from './ClientStreamTab';
import { BidiStreamTab } from './BidiStreamTab';
import { ArrowRight, ArrowDown, ArrowUp, Repeat, Layers } from 'lucide-react';

interface RpcDemoPanelProps {
  onAddLog: (type: any, rpc: any, msg: string, status: any) => void;
  onDataReceived: (temp: number, time: string, status: string, sensorId: string) => void;
  onAlertTriggered: () => void;
  isConnected: boolean;
}

export const RpcDemoPanel: React.FC<RpcDemoPanelProps> = ({
  onAddLog,
  onDataReceived,
  onAlertTriggered,
  isConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'UNARY' | 'SERVER_STREAM' | 'CLIENT_STREAM' | 'BIDI_STREAM'>('UNARY');

  const tabs = [
    {
      id: 'UNARY',
      label: '1. Unary RPC',
      desc: '1 Request -> 1 Response',
      icon: ArrowRight,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50 border-blue-600 text-blue-700',
    },
    {
      id: 'SERVER_STREAM',
      label: '2. Server Streaming',
      desc: '1 Request -> Stream Responses',
      icon: ArrowDown,
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-50 border-indigo-600 text-indigo-700',
    },
    {
      id: 'CLIENT_STREAM',
      label: '3. Client Streaming',
      desc: 'Stream Requests -> 1 Response',
      icon: ArrowUp,
      color: 'text-emerald-600',
      activeBg: 'bg-emerald-50 border-emerald-600 text-emerald-700',
    },
    {
      id: 'BIDI_STREAM',
      label: '4. Bidirectional Stream',
      desc: 'Stream Requests <-> Stream Responses',
      icon: Repeat,
      color: 'text-purple-600',
      activeBg: 'bg-purple-50 border-purple-600 text-purple-700',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Khu vực điều khiển và kiểm thử 4 kiểu giao tiếp gRPC
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          Chọn một mô hình để thao tác chi tiết
        </span>
      </div>

      {/* 4 Tabs Lựa chọn */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border ${
                isActive
                  ? 'bg-white border-slate-300 shadow-2xs font-semibold'
                  : 'bg-transparent border-transparent hover:bg-white/60 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${tab.color}`} />
                <span className="text-xs font-bold text-slate-800">{tab.label}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate pl-6">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Nội dung Tab được chọn */}
      <div className="p-5">
        {activeTab === 'UNARY' && (
          <UnaryTab
            onAddLog={onAddLog}
            onDataReceived={onDataReceived}
            isConnected={isConnected}
          />
        )}
        {activeTab === 'SERVER_STREAM' && (
          <ServerStreamTab
            onAddLog={onAddLog}
            onDataReceived={onDataReceived}
            isConnected={isConnected}
          />
        )}
        {activeTab === 'CLIENT_STREAM' && (
          <ClientStreamTab
            onAddLog={onAddLog}
            onDataReceived={onDataReceived}
            isConnected={isConnected}
          />
        )}
        {activeTab === 'BIDI_STREAM' && (
          <BidiStreamTab
            onAddLog={onAddLog}
            onDataReceived={onDataReceived}
            onAlertTriggered={onAlertTriggered}
            isConnected={isConnected}
          />
        )}
      </div>
    </div>
  );
};
