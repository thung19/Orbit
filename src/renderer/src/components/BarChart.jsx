export default function BarChart({ data, maxVal, color = 'var(--accent)' }) {
  const max = maxVal || Math.max(1, ...data.map(d => d.value))
  return (
    <div className="bar-chart">
      {data.map(d => (
        <div key={d.label} className="bar-chart-row">
          <span className="bar-chart-label">{d.label}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
            <span className="bar-chart-val">{d.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
