import React from 'react';

const ChipLoader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px]">      
      <div className="w-full max-w-[800px]">
        <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d2d2d" />
              <stop offset="100%" stopColor="#0f0f0f" />
            </linearGradient>

            <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eeeeee" />
              <stop offset="100%" stopColor="#888888" />
            </linearGradient>

            <linearGradient id="pinGradient" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#bbbbbb" />
              <stop offset="50%" stopColor="#888888" />
              <stop offset="100%" stopColor="#555555" />
            </linearGradient>
          </defs>

          <g id="traces">
            {/* Left Side Traces */}
            <Trace path="M100 100 H200 V210 H326" color="#9900ff" />
            <Trace path="M80 180 H180 V230 H326" color="#00ccff" />
            <Trace path="M60 260 H150 V250 H326" color="#ffea00" />
            <Trace path="M100 350 H200 V270 H326" color="#00ff15" />

            {/* Right Side Traces */}
            <Trace path="M700 90 H560 V210 H474" color="#00ccff" />
            <Trace path="M740 160 H580 V230 H474" color="#00ff15" />
            <Trace path="M720 250 H590 V250 H474" color="#ff3300" />
            <Trace path="M680 340 H570 V270 H474" color="#ffea00" />
          </g>

          {/* Main Chip Body */}
          <rect
            x="330" y="190" width="140" height="100"
            rx="20" ry="20"
            fill="url(#chipGradient)"
            stroke="#222"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.8))' }}
          />

          {/* Pins Left */}
          {[205, 225, 245, 265].map((y) => (
            <rect key={`pin-l-${y}`} x="322" y={y} width="8" height="10" fill="url(#pinGradient)" rx="2" />
          ))}

          {/* Pins Right */}
          {[205, 225, 245, 265].map((y) => (
            <rect key={`pin-r-${y}`} x="470" y={y} width="8" height="10" fill="url(#pinGradient)" rx="2" />
          ))}

          <text
            x="400" y="240"
            fontFamily="Arial, sans-serif"
            fontSize="22"
            fontWeight="bold"
            fill="url(#textGradient)"
            textAnchor="middle"
            alignmentBaseline="middle"
            className="tracking-widest"
          >
            Loading
          </text>

          {/* Node Points */}
          <circle cx="100" cy="100" r="5" fill="#333" />
          <circle cx="80" cy="180" r="5" fill="#333" />
          <circle cx="60" cy="260" r="5" fill="#333" />
          <circle cx="100" cy="350" r="5" fill="#333" />
          <circle cx="700" cy="90" r="5" fill="#333" />
          <circle cx="740" cy="160" r="5" fill="#333" />
          <circle cx="720" cy="250" r="5" fill="#333" />
          <circle cx="680" cy="340" r="5" fill="#333" />
        </svg>
      </div>
    </div>
  );
};

// Sub-component for clean paths
const Trace = ({ path, color }: { path: string; color: string }) => (
  <>
    <path d={path} fill="none" stroke="#333" strokeWidth="1.8" />
    <path 
      d={path} 
      fill="none" 
      stroke={color} 
      strokeWidth="1.8" 
      className="trace-flow" 
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    />
  </>
);

export default ChipLoader;