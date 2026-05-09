import type { WeatherData } from '../types'

function weatherInfo(code: number, isDay = 1): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear sky', icon: isDay ? '☀️' : '🌙' }
  if (code <= 3) return { label: 'Partly cloudy', icon: '⛅' }
  if (code <= 48) return { label: 'Foggy', icon: '🌫️' }
  if (code <= 55) return { label: 'Drizzle', icon: '🌦️' }
  if (code <= 67) return { label: 'Rain', icon: '🌧️' }
  if (code <= 77) return { label: 'Snow', icon: '❄️' }
  if (code <= 82) return { label: 'Showers', icon: '🌦️' }
  if (code <= 99) return { label: 'Thunderstorm', icon: '⛈️' }
  return { label: 'Unknown', icon: '🌡️' }
}

export default function WeatherTab({ data }: { data: WeatherData | null }) {
  if (!data) return <p className="text-muted">Loading weather...</p>

  const currentHour = new Date().getHours()
  const futureHourly = data.hourly.filter(h => {
    const hour = parseInt(h.time.split('T')[1].substring(0, 2))
    return hour >= currentHour
  })

  const { label, icon } = weatherInfo(data.current.weatherCode, data.current.isDay)

  return (
    <div className="d-flex flex-column gap-2">
      <div className="card">
        <div className="card-body py-1 d-flex align-items-center gap-3">
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{icon}</span>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>
              {Math.round(data.current.temperature)}°C
            </div>
            <div className="text-muted" style={{ fontSize: '0.7em' }}>{label}</div>
          </div>
          <div className="ms-auto d-flex gap-4" style={{ fontSize: '0.8em' }}>
            <div className="text-center">
              <div className="text-muted">Feels like</div>
              <div>{Math.round(data.current.apparentTemperature)}°C</div>
            </div>
            <div className="text-center">
              <div className="text-muted">Humidity</div>
              <div>{data.current.relativeHumidity}%</div>
            </div>
            <div className="text-center">
              <div className="text-muted">Wind</div>
              <div>{Math.round(data.current.windspeed)} km/h</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 overflow-auto" style={{ scrollbarWidth: 'none' }}>
        {futureHourly.map(h => {
          const { icon: hIcon } = weatherInfo(h.weatherCode)
          const hour = h.time.split('T')[1].substring(0, 5)
          return (
            <div key={h.time} className="card text-center" style={{ flex: '1 0 4rem' }}>
              <div className="card-body p-1">
                <div className="text-muted" style={{ fontSize: '0.6em' }}>{hour}</div>
                <div>{hIcon}</div>
                <div className="fw-bold" style={{ fontSize: '0.75em' }}>{Math.round(h.temperature)}°</div>
                <div className="text-primary" style={{ fontSize: '0.6em', minHeight: '1em' }}>
                  {h.precipitationProbability > 0 ? `${h.precipitationProbability}%` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="row row-cols-6 g-2 flex-grow-1">
        {data.daily.slice(1).map(d => {
          const { icon: dIcon } = weatherInfo(d.weatherCode)
          const date = new Date(d.date + 'T12:00:00')
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          return (
            <div key={d.date} className="col">
              <div className="card h-100 text-center">
                <div className="card-body py-1 d-flex flex-column justify-content-around">
                  <div className="fw-bold">{dayName}</div>
                  <div className="text-muted" style={{ fontSize: '0.65em' }}>{dateStr}</div>
                  <div style={{ fontSize: '1.4em' }}>{dIcon}</div>
                  <div className="d-flex justify-content-center gap-2">
                    <span className="fw-bold">{Math.round(d.temperatureMax)}°</span>
                    <span className="text-muted">{Math.round(d.temperatureMin)}°</span>
                  </div>
                  <div className="text-primary" style={{ fontSize: '0.65em', minHeight: '1em' }}>
                    {d.precipitationProbabilityMax > 0 ? `${d.precipitationProbabilityMax}%` : ''}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
