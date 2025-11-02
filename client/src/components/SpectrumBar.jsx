import './SpectrumBar.css'

/**
 * SpectrumBar - A linear spectrum display with labels and tick marks
 * Shows a horizontal bar representing a spectrum from left (0) to right (100)
 * 
 * @param {string} leftLabel - Label for the left side (e.g., "Spicy")
 * @param {string} rightLabel - Label for the right side (e.g., "Mild")
 * @param {number|null} target - Optional target marker position (0-100)
 * @param {number|null} placement - Optional placement marker position (0-100)
 * @param {boolean} showTicks - Whether to show tick marks (default: true)
 */
function SpectrumBar({ leftLabel, rightLabel, target = null, placement = null, showTicks = true }) {
  return (
    <div className="spectrum-display">
      <div className="spectrum-bar">
        <span className="spectrum-left">{leftLabel}</span>
        <div className="spectrum-line">
          {showTicks && (
            <div className="spectrum-ticks">
              <span className="tick">0</span>
              <span className="tick">25</span>
              <span className="tick">50</span>
              <span className="tick">75</span>
              <span className="tick">100</span>
            </div>
          )}
          {target !== null && (
            <div className="target-marker" style={{ left: `${target}%` }}>
              <div className="marker-label">🎯 Target: {target}</div>
            </div>
          )}
          {placement !== null && (
            <div className="placement-marker" style={{ left: `${placement}%` }}>
              <div className="marker-label">📍 Guess: {placement}</div>
            </div>
          )}
        </div>
        <span className="spectrum-right">{rightLabel}</span>
      </div>
    </div>
  )
}

export default SpectrumBar
