import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ExplorerScreen } from '../../src/features/explorer/ExplorerScreen'

export default function ExplorerTabRoute() {
  const bottomTabBarHeight = useBottomTabBarHeight()

  return <ExplorerScreen bottomContentInset={bottomTabBarHeight} />
}
