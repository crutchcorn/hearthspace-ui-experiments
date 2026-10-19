import { useEffect, useState } from 'react'

export function useSystemStatus() {
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [volume, setVolume] = useState(64)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  return {
    wifiEnabled,
    setWifiEnabled,
    volume,
    setVolume,
    now,
    batteryPercentage: 87,
  }
}

export type SystemStatus = ReturnType<typeof useSystemStatus>
