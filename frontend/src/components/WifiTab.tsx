import type { WifiData } from '../types'

interface Props {
  data: WifiData | null
}

export default function WifiTab({ data }: Props) {
  if (!data) return <p className="text-muted">Loading...</p>

  return (
    <div className="d-flex align-items-start gap-3">
      <img id="wifi-qr-code" src={data.qrCodeDataUrl} alt="WiFi QR Code" />
      <div>
        <p id="wifi-ssid" className="mb-1">SSID: {data.ssid}</p>
        <p id="wifi-password" className="mb-1">PW: {data.pass}</p>
      </div>
    </div>
  )
}
