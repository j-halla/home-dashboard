import type { StationboardData } from '../types'

interface Props {
  data: StationboardData | null
}

export default function StationboardTab({ data }: Props) {
  if (!data) return <p className="text-muted">Loading...</p>

  const now = new Date()

  return (
    <table className="table" id="stationboard-container">
      <thead>
        <tr>
          <th>Line</th>
          <th>Destination</th>
          <th>Min</th>
        </tr>
      </thead>
      <tbody>
        {data.stationboard.map((entry, i) => {
          const scheduled = new Date(entry.stop.departure)
          const actual = entry.stop.prognosis.departure
            ? new Date(entry.stop.prognosis.departure)
            : scheduled
          const delay = Math.floor((actual.getTime() - scheduled.getTime()) / 60000)
          const minutes = Math.max(0, Math.floor((actual.getTime() - now.getTime()) / 60000))
          const minDisplay = delay > 0 ? `${minutes} (+${delay})` : `${minutes}`

          return (
            <tr key={i}>
              <td>{entry.number || entry.category}</td>
              <td>{entry.to}</td>
              <td>{minDisplay}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
