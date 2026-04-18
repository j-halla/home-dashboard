import { useState } from 'react'
import { useSse } from './hooks/useSse'
import StationboardTab from './components/StationboardTab'
import LightsTab from './components/LightsTab'
import CalendarTab from './components/CalendarTab'
import WifiTab from './components/WifiTab'
import type { CalendarData, LightGroups, StationboardData, WifiData } from './types'

export default function App() {
  const [stationboard, setStationboard] = useState<StationboardData | null>(null)
  const [lightGroups, setLightGroups] = useState<LightGroups | null>(null)
  const [lightState, setLightState] = useState<LightGroups | null>(null)
  const [calendar, setCalendar] = useState<CalendarData | null>(null)
  const [wifi, setWifi] = useState<WifiData | null>(null)

  useSse('/sse', {
    stationboard: data => setStationboard(data as StationboardData),
    groups: data => setLightGroups(data as LightGroups),
    light: data => setLightState(data as LightGroups),
    calendar: data => setCalendar(data as CalendarData),
    wifi: data => setWifi(data as WifiData),
  })

  return (
    <div className="container-fluid py-3">
      <ul className="nav nav-tabs" id="mainTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#stationboard" type="button" role="tab">
            Stationboard
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#lights" type="button" role="tab">
            Lights
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#calendar" type="button" role="tab">
            Calendar
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" data-bs-toggle="tab" data-bs-target="#wifi" type="button" role="tab">
            WiFi
          </button>
        </li>
      </ul>
      <div className="tab-content pt-3">
        <div className="tab-pane fade show active" id="stationboard" role="tabpanel">
          <StationboardTab data={stationboard} />
        </div>
        <div className="tab-pane fade" id="lights" role="tabpanel">
          <LightsTab groups={lightGroups} lightState={lightState} />
        </div>
        <div className="tab-pane fade" id="calendar" role="tabpanel">
          <CalendarTab data={calendar} />
        </div>
        <div className="tab-pane fade" id="wifi" role="tabpanel">
          <WifiTab data={wifi} />
        </div>
      </div>
    </div>
  )
}
