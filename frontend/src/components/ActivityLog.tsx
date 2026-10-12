import React, { useState } from 'react';
import type { LogEntry } from '../types/sensor';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">
            Nhật ký hoạt động (gRPC Protocol Activity Log)
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-mono">
            {logs.length} sự kiện
          </span>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs px-2 py-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 flex items-center gap-1 transition-colors cursor-pointer"
              title="Xóa nhật ký"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px] bg-slate-950 text-slate-300 p-2">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 italic">
              Chưa có sự kiện RPC nào phát sinh. Kích hoạt một chức năng để quan sát.
            </div>
          ) : (
            logs.map((log) => {
              const statusColor =
                log.status === 'success'
                  ? 'text-emerald-400'
                  : log.status === 'error'
                  ? 'text-rose-400'
                  : log.status === 'warning'
                  ? 'text-amber-400'
                  : 'text-blue-400';

              const rpcBadge =
                log.rpcType === 'UNARY'
                  ? 'bg-blue-900/60 text-blue-300'
                  : log.rpcType === 'SERVER_STREAM'
                  ? 'bg-indigo-900/60 text-indigo-300'
                  : log.rpcType === 'CLIENT_STREAM'
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : log.rpcType === 'BIDI_STREAM'
                  ? 'bg-purple-900/60 text-purple-300'
                  : 'bg-slate-800 text-slate-300';

              return (
                <div key={log.id} className="py-1 px-2 flex items-start gap-2 hover:bg-slate-900/80">
                  <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`px-1 rounded text-[10px] shrink-0 font-semibold ${rpcBadge}`}>
                    {log.rpcType}
                  </span>
                  <span className={`px-1 rounded text-[10px] shrink-0 font-medium ${statusColor}`}>
                    {log.type}
                  </span>
                  <span className="text-slate-200 break-all">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
