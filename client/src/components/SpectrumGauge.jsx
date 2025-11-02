import { useEffect, useState } from 'react'
import './SpectrumGauge.css'

/**
 * SpectrumGauge - A professional gauge component for displaying spectrum values (0-100)
 * Similar to a vehicle temperature gauge with a semi-circular display, colored gradient,
 * animated needle, and prominent number display.
 * 
 * @param {number} value - The value to display (0-100)
 * @param {string} leftLabel - Label for the left side (e.g., "Cold")
 * @param {string} rightLabel - Label for the right side (e.g., "Hot")
 * @param {string} valueLabel - Label for the value (default: 'TARGET')
 * @param {boolean} animate - Whether to animate the needle (default: true)
 * @param {string} size - Size variant: 'small', 'medium', 'large' (default: 'medium')
 */
function SpectrumGauge({ value, leftLabel = '', rightLabel = '', valueLabel = 'TARGET', animate = true, size = 'medium' }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))
  
  // Animate the value change
  useEffect(() => {
    if (!animate) {
      setDisplayValue(clampedValue)
      return
    }
    
    const duration = 1000 // 1 second animation
    const steps = 60 // 60 steps for smooth animation
    const increment = (clampedValue - displayValue) / steps
    const stepDuration = duration / steps
    
    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayValue(clampedValue)
        clearInterval(timer)
      } else {
        setDisplayValue(prev => prev + increment)
      }
    }, stepDuration)
    
    return () => clearInterval(timer)
  }, [clampedValue, animate, displayValue])
  
  // Calculate rotation angle for the needle
  // Gauge spans 180 degrees (semi-circle), starting at -90 degrees (left) to 90 degrees (right)
  const needleAngle = -90 + (displayValue / 100) * 180
  
  // Calculate color based on value (gradient from blue to yellow to red)
  const getColor = (val) => {
    if (val <= 50) {
      // Blue to Yellow (0-50)
      const ratio = val / 50
      const r = Math.round(100 + ratio * 155)
      const g = Math.round(150 + ratio * 105)
      const b = Math.round(255 - ratio * 155)
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Yellow to Red (50-100)
      const ratio = (val - 50) / 50
      const r = 255
      const g = Math.round(255 - ratio * 100)
      const b = Math.round(100 - ratio * 100)
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  
  const needleColor = getColor(displayValue)
  
  return (
    <div className={`spectrum-gauge spectrum-gauge-${size}`}>
      <div className="gauge-container">
        {/* Gauge background arc */}
        <svg className="gauge-svg" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          {/* Background arc */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(100, 150, 255)', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: 'rgb(255, 255, 100)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(255, 100, 100)', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="gaugeShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Outer arc background */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            style={{ filter: 'url(#gaugeShadow)' }}
          />
          
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = -90 + (tick / 100) * 180
            const radians = (angle * Math.PI) / 180
            const innerRadius = 62
            const outerRadius = 72
            const x1 = 100 + innerRadius * Math.cos(radians)
            const y1 = 100 + innerRadius * Math.sin(radians)
            const x2 = 100 + outerRadius * Math.cos(radians)
            const y2 = 100 + outerRadius * Math.sin(radians)
            
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#333"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
          
          {/* Needle */}
          <g transform={`rotate(${needleAngle} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke={needleColor}
              strokeWidth="4"
              strokeLinecap="round"
              style={{ 
                filter: 'url(#gaugeShadow)',
                transition: animate ? 'all 0.3s ease-out' : 'none'
              }}
            />
            <circle
              cx="100"
              cy="100"
              r="8"
              fill={needleColor}
              style={{ filter: 'url(#gaugeShadow)' }}
            />
          </g>
          
          {/* Tick labels */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = -90 + (tick / 100) * 180
            const radians = (angle * Math.PI) / 180
            const labelRadius = 88
            const x = 100 + labelRadius * Math.cos(radians)
            const y = 100 + labelRadius * Math.sin(radians)
            
            return (
              <text
                key={`label-${tick}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="gauge-tick-label"
                fontSize="10"
                fontWeight="600"
                fill="#666"
              >
                {tick}
              </text>
            )
          })}
        </svg>
        
        {/* Center display */}
        <div className="gauge-center-display">
          <div className="gauge-value" style={{ color: needleColor }}>
            {Math.round(displayValue)}
          </div>
          <div className="gauge-value-label">{valueLabel}</div>
        </div>
        
        {/* Side labels */}
        {leftLabel && rightLabel && (
          <div className="gauge-labels">
            <span className="gauge-label-left">{leftLabel}</span>
            <span className="gauge-label-right">{rightLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SpectrumGauge
