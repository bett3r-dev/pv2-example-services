import {Event, Role, RoleSchema, UserAuthorization, UserAuthorizationSchema} from '@bett3r-dev/server-core'

export const RoleUpserted: Event<Role> = () => ({
  schema: RoleSchema
})
export const UserAuthorizationUpserted: Event<UserAuthorization> = () => ({
  schema: UserAuthorizationSchema
})