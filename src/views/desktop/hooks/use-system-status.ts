import { useEffect, useState } from 'react'
import { useWifi } from './use-wifi'
import { useBluetooth } from './use-bluetooth'

import type { SystemStatus } from '../types/system-status'

export function useSystemStatus(): SystemStatus {
  const wifi = useWifi()
  const bluetooth = useBluetooth()
  const [volume, setVolume] = useState(64)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  return {
    ...wifi,
    ...bluetooth,
    volume,
    setVolume,
    now,
    batteryPercentage: 87,
  }
}
