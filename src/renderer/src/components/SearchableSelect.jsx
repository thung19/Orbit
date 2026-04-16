import { useState, useMemo, useRef, useEffect } from 'react'

export default function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    if (!query) return options
    return options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  }, [query, options])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (open && query === '') onChange('')
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, query])

  return (
    <div ref={ref} className="searchable-select">
      <div
        className="searchable-select-trigger"
        onClick={() => { setOpen(true); setQuery(value || ''); setTimeout(() => inputRef.current?.focus(), 0) }}
      >
        {open ? (
          <input
            ref={inputRef}
            className="searchable-select-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
        )}
      </div>
      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <div className="searchable-select-empty">No results</div>
          ) : filtered.map(o => (
            <div
              key={o}
              className={`searchable-select-option${o === value ? ' selected' : ''}`}
              onClick={() => { onChange(o); setOpen(false); setQuery('') }}
            >{o}</div>
          ))}
        </div>
      )}
    </div>
  )
}
