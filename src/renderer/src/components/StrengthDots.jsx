export default function StrengthDots({ score }) {
  return (
    <span className="strength-dots">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`strength-dot${n <= score ? ' filled' : ''}`} />
      ))}
    </span>
  )
}
