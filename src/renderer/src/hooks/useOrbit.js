import { useState, useEffect, useCallback } from 'react'

// Simple event bus for cross-hook data invalidation
const listeners = {}
export function onDataChange(event, fn) {
  if (!listeners[event]) listeners[event] = new Set()
  listeners[event].add(fn)
  return () => listeners[event].delete(fn)
}
export function emitDataChange(event) {
  if (listeners[event]) listeners[event].forEach(fn => fn())
}

// Generic data fetcher hook
export function useData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload() }, [reload])

  return { data, loading, error, reload }
}

export function useContacts() {
  const result = useData(() => window.orbit.getContacts())
  // Re-fetch contacts when outreach changes (status affects avatar color)
  useEffect(() => {
    return onDataChange('outreach-changed', result.reload)
  }, [result.reload])
  return result
}

export function useOutreach() {
  return useData(() => window.orbit.getOutreach())
}

export function useSettings() {
  return useData(() => window.orbit.getSettings())
}
