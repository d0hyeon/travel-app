import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ExplorerCatalogScreen } from '../../src/features/explorer/ExplorerCatalogScreen'

export default function ExplorerTabRoute() {
  const bottomTabBarHeight = useBottomTabBarHeight()

  return <ExplorerCatalogScreen bottomContentInset={bottomTabBarHeight} />
}
