import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs'
import { useCallback } from 'react'
import type { HomeTabParamList } from '~app/routes'

export function useTabSwipeLock(isLocked: boolean) {
  const navigation = useNavigation<MaterialTopTabNavigationProp<HomeTabParamList>>()

  useFocusEffect(
    useCallback(() => {
      if (!isLocked) return
      navigation.setOptions({ swipeEnabled: false })
      return () => navigation.setOptions({ swipeEnabled: true })
    }, [navigation, isLocked]),
  )
}
