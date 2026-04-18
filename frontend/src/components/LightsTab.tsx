import { useEffect, useRef, useState } from 'react'
import type { LightGroups } from '../types'

interface Props {
  groups: LightGroups | null
  lightState: LightGroups | null
}

export default function LightsTab({ groups, lightState }: Props) {
  const [localGroups, setLocalGroups] = useState<LightGroups | null>(null)
  const pendingRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (groups) {
      setLocalGroups(groups)
      pendingRef.current.clear()
    }
  }, [groups])

  useEffect(() => {
    if (!lightState) return
    setLocalGroups(prev => {
      if (!prev) return lightState
      const updated = { ...prev }
      Object.keys(lightState).forEach(id => {
        if (!pendingRef.current.has(id)) {
          updated[id] = { ...prev[id], action: lightState[id].action }
        }
      })
      return updated
    })
  }, [lightState])

  const handleToggle = async (groupId: string, on: boolean) => {
    pendingRef.current.add(groupId)
    await fetch('/api/trigger-light', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on, id: groupId }),
    })
    pendingRef.current.delete(groupId)
  }

  if (!localGroups) return <p className="text-muted">Loading...</p>

  return (
    <div className="d-flex flex-wrap gap-3" id="lights-container">
      {Object.entries(localGroups).map(([id, group]) => (
        <div className="card" key={id} style={{ minWidth: '140px' }}>
          <div className="card-body">
            <p className="card-title text-center mb-2">{group.name}</p>
            <div className="form-check form-switch d-flex justify-content-center">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id={`switch-${id}`}
                checked={group.action.on}
                onChange={e => handleToggle(id, e.target.checked)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
