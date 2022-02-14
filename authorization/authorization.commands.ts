import {Command, Role, RoleSchema, UserAuthorization, UserAuthorizationSchema} from '@bett3r-dev/server-core'
import { RoleUpserted, UserAuthorizationUpserted } from './authorization.events'
import joi from 'joi';

export const UpsertRole: Command<Role> = () => ({
  isPublic: true,
  requiresAuth: true,
  events: [RoleUpserted],
  schema: RoleSchema
})
export const UpsertUserAuthorization: Command<UserAuthorization> = () => ({
  isPublic: true,
  requiresAuth: true,
  events: [UserAuthorizationUpserted],
  schema: UserAuthorizationSchema
})