import type { CalendarData } from '../types'

interface Props {
  data: CalendarData | null
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}.${month}.`
}

export default function CalendarTab({ data }: Props) {
  if (!data) return <p className="text-muted">Loading...</p>

  const rows = Array.from({ length: 3 }, (_, i) => i)

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Cardboard</th>
          <th>Paper</th>
          <th>Mr. Green</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(i => (
          <tr key={i}>
            <td>{data.cardboard[i] ? formatDate(data.cardboard[i]) : '—'}</td>
            <td>{data.paper[i] ? formatDate(data.paper[i]) : '—'}</td>
            <td>{data.mrgreen[i] ? formatDate(data.mrgreen[i]) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
