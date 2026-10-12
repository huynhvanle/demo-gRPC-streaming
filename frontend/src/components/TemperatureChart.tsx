import React, { useMemo } from 'react';
import { LineChart as ChartIcon, Trash2, TrendingUp } from 'lucide-react';

export interface DataPoint {
  time: string;
  temperature: number;
}

interface TemperatureChartProps {
  data: DataPoint[];
  onClear: () => void;
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({ data, onClear }) => {
  // Giới hạn hiển thị 25 điểm gần nhất
  const displayData = useMemo(() => {
    return data.slice(-25);
  }, [data]);

  // Tính toán miền giá trị Y
  const { minTemp, maxTemp, points, polylinePath, areaPath } = useMemo(() => {
    if (displayData.length === 0) {
      return { minTemp: 20, maxTemp: 45, points: [], polylinePath: '', areaPath: '' };
    }

    const temps = displayData.map(d => d.temperature);
    let min = Math.min(...temps);
    let max = Math.max(...temps);

    // Padding miền giá trị để biểu đồ không chạm sát mép
    min = Math.floor(Math.max(0, min - 2));
    max = Math.ceil(max + 2);
    if (max - min < 6) {
      max = min + 6;
    }

    const width = 800;
    const height = 220;
    const paddingX = 45;
    const paddingY = 25;

    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const pts = displayData.map((d, i) => {
      const x = displayData.length > 1
        ? paddingX + (i / (displayData.length - 1)) * chartW
        : width / 2;
      const y = height - paddingY - ((d.temperature - min) / (max - min)) * chartH;
      return { x, y, temp: d.temperature, time: d.time };
    });

    const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    let area = '';
    if (pts.length > 0) {
      const firstX = pts[0].x;
      const lastX = pts[pts.length - 1].x;
      const baseY = height - paddingY;
      area = `M ${firstX},${baseY} L ${poly.replace(/ /g, ' L ')} L ${lastX},${baseY} Z`;
    }

    return { minTemp: min, maxTemp: max, points: pts, polylinePath: poly, areaPath: area };
  }, [displayData]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Biến thiên nhiệt độ thời gian thực</h2>
            <p className="text-xs text-slate-500">
              Hiển thị tối đa 25 điểm đo gần nhất từ các luồng gRPC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {displayData.length} điểm đo
          </span>
          {displayData.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xóa dữ liệu biểu đồ"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Xóa biểu đồ</span>
            </button>
          )}
        </div>
      </div>

      {displayData.length === 0 ? (
        <div className="h-48 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
          <ChartIcon className="w-8 h-8 mb-2 text-slate-300 stroke-1" />
          <p className="text-xs font-medium text-slate-500">Chưa có dữ liệu đo nhiệt độ</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Hãy kích hoạt một trong các chức năng gRPC bên dưới để nhận dữ liệu từ Server
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 800 220" className="w-full h-52 select-none">
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines ngang & nhãn nhiệt độ */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = 25 + ratio * (220 - 50);
              const val = (maxTemp - ratio * (maxTemp - minTemp)).toFixed(1);
              return (
                <g key={idx}>
                  <line
                    x1="45"
                    y1={y}
                    x2="755"
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={ratio === 0 || ratio === 1 ? 'none' : '3 3'}
                  />
                  <text
                    x="40"
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val}°C
                  </text>
                </g>
              );
            })}

            {/* Vùng diện tích gradient */}
            {areaPath && <path d={areaPath} fill="url(#tempGradient)" />}

            {/* Đường biểu đồ chính */}
            {polylinePath && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePath}
              />
            )}

            {/* Các điểm đo tròn */}
            {points.map((p, idx) => {
              const isWarning = p.temp >= 32.0 && p.temp < 38.0;
              const isCritical = p.temp >= 38.0;
              const pointColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#2563eb';

              return (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={idx === points.length - 1 ? 5 : 3.5}
                    fill={pointColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="transition-all hover:r-6"
                  />
                  {/* Nhãn giá trị điểm cuối cùng */}
                  {idx === points.length - 1 && (
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill={pointColor}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {p.temp.toFixed(1)}°C
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nhãn thời gian trục X */}
            {points.length > 0 && (
              <>
                <text x={points[0].x} y="212" textAnchor="start" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  {points[0].time.split(' ')[1] || points[0].time}
                </text>
                <text x={points[points.length - 1].x} y="212" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  {points[points.length - 1].time.split(' ')[1] || points[points.length - 1].time}
                </text>
              </>
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
