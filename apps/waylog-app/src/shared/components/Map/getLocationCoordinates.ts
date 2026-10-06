import { getLocationCoordinates as loadLocationCoordinates } from '@waylog/domains/modules/map'
import { createFileStorage } from '~shared/modules/persistent-cache/createFileStorage'
import { withPersistentCache } from '~shared/modules/persistent-cache/withPersistentCache'

export const getLocationCoordinates = withPersistentCache(loadLocationCoordinates, {
  storage: createFileStorage('location-coordinates'),
  key: ({ location, level }) => `${location}:${level ?? 'auto'}`,
})
