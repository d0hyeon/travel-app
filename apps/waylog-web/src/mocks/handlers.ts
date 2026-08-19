import authHandlers from '~features/auth/auth.mock'
import triphandlers from '~features/trip/trip.mock'
import userProfileHandlers from '~features/user-profile/userProfile.mock'


export const handlers = [
  ...authHandlers,
  ...triphandlers,
  ...userProfileHandlers
]
