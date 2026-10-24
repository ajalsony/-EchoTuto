import React from 'react';

export interface RadarDimension {
  label: string;
  value: number; // 0 - 100
  code: string;
}

interface SkillRadarChartProps {
  dimensions: RadarDimension[];
  isCalibrating: boolean;
  userRole?: string;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  dimensions,
  isCalibrating,
  userRole = 'SWE-RUNTIME',
}) => {
  const center = 100;
  const maxRadius = 70;
  const count = dimensions.length;

  // Compute vertex for each dimension value
  const getCoordinates = (value: number, index: number) => {
    const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
    const r = Math.max(12, (value / 100) * maxRadius);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Polygon points for active data
  const dataPoints = dimensions
    .map((dim, i) => {
      const { x, y } = getCoordinates(dim.value, i);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Outer reference polygon at 100%
  const getGridPolygon = (fraction: number) => {
    return Array.from({ length: count })
      .map((_, i) => {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const r = maxRadius * fraction;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="flex flex-col items-center justify-center py-2 relative w-full">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          aria-label="Skill Diagnostic Radar Chart"
          role="img"
        >
          {/* Concentric Grid Rings */}
          <polygon
            points={getGridPolygon(1.0)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          <polygon
            points={getGridPolygon(0.7)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1"
          />
          <polygon
            points={getGridPolygon(0.4)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1"
          />

          {/* Axis Spoke Lines */}
          {Array.from({ length: count }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
            const x = center + maxRadius * Math.cos(angle);
            const y = center + maxRadius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* Active Metric Area Polygon */}
          <polygon
            points={dataPoints}
            fill={isCalibrating ? 'rgba(0, 240, 255, 0.06)' : 'rgba(0, 240, 255, 0.22)'}
            stroke="#00F0FF"
            strokeWidth={isCalibrating ? '1.5' : '2'}
            strokeDasharray={isCalibrating ? '3,3' : undefined}
            className="transition-all duration-700 ease-out"
          />

          {/* Highlight Vertex Nodes */}
          {dimensions.map((dim, i) => {
            const { x, y } = getCoordinates(dim.value, i);
            const isHigh = dim.value >= 75;
            const isLow = dim.value < 60 && !isCalibrating;
            const nodeFill = isCalibrating
              ? '#9EA6B0'
              : isLow
              ? '#FF4D6D'
              : isHigh
              ? '#00FF85'
              : '#00F0FF';

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={nodeFill}
                  className="transition-all duration-500"
                />
              </g>
            );
          })}
        </svg>

        {/* Center Tag Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0] bg-[#0A0B0D]/85 border border-white/[0.08] px-2 py-0.5 rounded shadow-sm">
            {isCalibrating ? 'CALIBRATING' : `RADAR::${userRole.substring(0, 10).toUpperCase()}`}
          </span>
        </div>
      </div>

      {/* Axis Labels Grid Below */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-white/[0.06]">
        {dimensions.map((dim, i) => (
          <div key={i} className="flex flex-col text-left">
            <span className="font-mono text-[10px] text-[#9EA6B0] truncate">
              {dim.label}
            </span>
            <span
              className={`font-mono text-xs font-bold ${
                isCalibrating
                  ? 'text-[#9EA6B0]'
                  : dim.value >= 75
                  ? 'text-[#00FF85]'
                  : dim.value < 60
                  ? 'text-[#FF4D6D]'
                  : 'text-[#00F0FF]'
              }`}
            >
              {isCalibrating ? '--' : `${dim.value}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
