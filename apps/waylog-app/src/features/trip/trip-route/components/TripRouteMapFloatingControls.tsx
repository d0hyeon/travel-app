import { MaterialIcons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { Modal, Pressable } from 'react-native'
import { Box, Button, Stack, Switch, Typography } from '../../../../shared/components/mui'
import { IconButton } from '../../../../shared/components/mui/IconButton'
import { palette, radius } from '../../../../shared/config/tokens'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { useTripViewConfig } from '../useTripViewConfig'
import { FloatingControl } from '../../components/FloatingControl'
import { TripRouteMapConfigDialog } from './TripRouteMapConfigDialog'

export function TripRouteMapFloatingControls() {
  const overlay = useOverlay()

  const openSettingDialog = () => {
    overlay.open(({ isOpen, close, onClose }) => (
      <TripRouteMapConfigDialog isOpen={isOpen} onDismiss={close} onRequestClose={onClose} />
    ))
  }

  return (
    <FloatingControl corner="top-right" zIndex={8}>
      <IconButton onClick={openSettingDialog}>
        <MaterialIcons name="settings" size={22} color={palette.info} />
      </IconButton>
    </FloatingControl>
  )
}

