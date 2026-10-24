import { useEffect, useReducer } from 'react'
import { WIFI_PASSWORD } from '../constants/wifi'
import type {
  WifiEnterpriseCredentials,
  WifiHiddenNetworkInput,
  WifiNetworkSettings,
  WifiState,
} from '../types/wifi'
import {
  createWifiSession,
  makeNetwork,
  validateEnterpriseCredentials,
  validateWifiSettings,
  wifiReducer,
} from '../utils/wifi'

export function useWifi(): WifiState {
  const [state, dispatch] = useReducer(
    wifiReducer,
    undefined,
    createWifiSession,
  )

  useEffect(() => {
    if (!state.pending) return
    const token = state.pending.token
    const timer = window.setTimeout(
      () => dispatch({ type: 'complete', token }),
      700,
    )
    return () => window.clearTimeout(timer)
  }, [state.pending])

  useEffect(() => {
    if (state.scanToken === null) return
    const token = state.scanToken
    const timer = window.setTimeout(
      () => dispatch({ type: 'scanned', token }),
      650,
    )
    return () => window.clearTimeout(timer)
  }, [state.scanToken])

  const wifiNetwork = state.enabled
    ? (state.networks.find((network) => network.id === state.connectedId) ??
      null)
    : null
  const wifiPendingNetwork = state.pending
    ? (state.networks.find(
        (network) => network.id === state.pending?.networkId,
      ) ?? null)
    : null
  const wifiConnectionStatus = !state.enabled
    ? 'Wi-Fi off'
    : wifiPendingNetwork
      ? `Connecting to ${wifiPendingNetwork.name}…`
      : !wifiNetwork
        ? 'Not connected'
        : wifiNetwork.scenario === 'limited'
          ? 'Connected · No internet'
          : wifiNetwork.scenario === 'portal' && !wifiNetwork.portalAccepted
            ? 'Connected · Sign-in required'
            : 'Connected'

  function wifiConnect(
    id: string,
    password = '',
    remember = true,
    enterprise?: WifiEnterpriseCredentials,
  ): string | null {
    if (!state.enabled) return 'Turn on Wi-Fi to connect.'
    const network = state.networks.find((item) => item.id === id)
    if (!network)
      return 'This network is no longer available. Refresh the network list.'
    if (
      network.secured &&
      !network.credentialsRemembered &&
      password !== WIFI_PASSWORD
    )
      return password
        ? 'Incorrect password. Try again.'
        : 'Enter the network password.'
    if (
      network.security === 'WPA2 Enterprise' &&
      !network.credentialsRemembered
    ) {
      const error = validateEnterpriseCredentials(enterprise)
      if (error) return error
    }
    dispatch({
      type: 'connect',
      id,
      remember,
      enterpriseMethod: enterprise?.method,
    })
    return null
  }

  function selectWifiNetwork(id: string | null) {
    if (!state.enabled) return
    if (id === null) dispatch({ type: 'disconnect' })
    else {
      const error = wifiConnect(id)
      if (error)
        dispatch({
          type: 'feedback',
          feedback: { message: error, networkId: id, error: true },
        })
    }
  }

  function wifiJoinHiddenNetwork(input: WifiHiddenNetworkInput): string | null {
    if (!state.enabled) return 'Turn on Wi-Fi to connect.'
    const name = input.name.trim()
    if (!name || new TextEncoder().encode(name).length > 32)
      return 'Enter a network name between 1 and 32 bytes.'
    const existing = state.networks.find((network) => network.name === name)
    if (existing) {
      if (existing.security !== input.security)
        return 'The security type does not match this network.'
      return wifiConnect(
        existing.id,
        input.password,
        input.remember,
        input.enterprise,
      )
    }
    if (input.security !== 'Open' && input.password !== WIFI_PASSWORD)
      return input.password
        ? 'Incorrect password. Try again.'
        : 'Enter the network password.'
    if (input.security === 'WPA2 Enterprise') {
      const error = validateEnterpriseCredentials(input.enterprise)
      if (error) return error
    }
    const network = makeNetwork(
      `hidden-${state.sequence + 1}`,
      name,
      input.security,
      { hidden: true, enterpriseMethod: input.enterprise?.method },
    )
    dispatch({ type: 'hidden', network, remember: input.remember })
    return null
  }

  function wifiSaveSettings(
    id: string,
    settings: WifiNetworkSettings,
  ): string | null {
    if (!state.networks.some((network) => network.id === id))
      return 'This network is no longer available.'
    const error = validateWifiSettings(settings)
    if (error) return error
    dispatch({ type: 'settings', id, settings: { ...settings } })
    return null
  }

  return {
    wifiEnabled: state.enabled,
    setWifiEnabled: (enabled: boolean) =>
      dispatch({ type: 'enabled', enabled }),
    wifiNetwork,
    wifiLabel: !state.enabled
      ? 'Wi-Fi off'
      : wifiPendingNetwork
        ? `Connecting to ${wifiPendingNetwork.name}…`
        : (wifiNetwork?.name ?? 'Not connected'),
    selectWifiNetwork,
    wifiNetworks: state.networks,
    wifiConnectionStatus,
    wifiPendingNetwork,
    wifiScanning: state.scanToken !== null,
    wifiScanCount: state.scanCount,
    wifiFeedback: state.feedback,
    wifiConnect,
    wifiJoinHiddenNetwork,
    wifiSaveSettings,
    wifiScan: () => dispatch({ type: 'scan' }),
    wifiCancelConnection: () => dispatch({ type: 'cancel' }),
    wifiForgetNetwork: (id: string) => dispatch({ type: 'forget', id }),
    wifiAcceptPortal: (id: string) => dispatch({ type: 'portal', id }),
    wifiClearFeedback: () => dispatch({ type: 'feedback', feedback: null }),
  }
}
