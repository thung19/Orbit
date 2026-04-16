export default function StrengthPicker({ value, onChange }) {
  const score = parseInt(value) || 0
  return (
    <div className="strength-picker">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`strength-pick-dot${n <= score ? ' filled' : ''}`}
          onClick={() => onChange(n === score ? 0 : n)}
          title={`${n} / 5`}
        />
      ))}
      {score > 0 && <span className="strength-pick-label">{score} / 5</span>}
    </div>
  )
}
