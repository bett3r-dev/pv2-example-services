import { AppServiceParams } from 'src/types';
import * as AuthorizationCommands from './authorization.commands';
import * as AuthorizationEvents from './authorization.events';
import { AuthorizationRoles as RolesSystem } from './authorizationRoles.system';
// import { Roles as RolesProjector } from './roleUsers.projector';
import { UsersAuthorization as UsersAuthorizationSystem } from './usersAuthorization.system';
import { UsersAuthorization as UsersAuthorizationProjector } from './usersAuthorization.projector';
import { createError, EventSourcingManager, Role, UnauthorizedError, UserAuthorization } from '@bett3r-dev/server-core';
import { Async, isString } from '@bett3r-dev/crocks';
import joi from 'joi';

export type AuthorizationConfig = {
  useTenants: boolean,
  useScopes: boolean,
  mongo: {
    instance: string,
    usersCollection: string,
    rolesCollection: string
  }
  cache: {
    enabled: boolean
    expiration: number
  }
}

export type AuthorizationServiceParams = AppServiceParams & {
  configStream: flyd.Stream<AuthorizationConfig>
}

export type FilterRoleParams = Partial<{
  excludeDisabled: boolean, 
  tenant: string, 
  scope: string
}>

export const authorizeUsersActions = (eventsourcing: EventSourcingManager, configStream: flyd.Stream<AuthorizationConfig>) => (username:string, user:UserAuthorization) => {
  if (username !== user.username && !user.resources.UsersRoles)
    return Async.Rejected(createError(UnauthorizedError, null))
  return eventsourcing.loadStream(UsersAuthorizationSystem, {direction: 'backwards', limit: 1, from: 'end'})(username)
    .chain(users => users.length ? Async.of(users[0]) : Async.Rejected(createError(UnauthorizedError, 'User Does Not Exists')))
    .chain((userAuthorization: UserAuthorization) => {
      if (
        username !== user.username && 
        configStream().useTenants && 
        userAuthorization && 
        !userAuthorization.tenants.some(t => user.tenants.includes(t))
      ) return Async.Rejected(createError(UnauthorizedError, null))
      return Async.of(userAuthorization);
    })
}

export const authorizeRolesActions = (configStream: flyd.Stream<AuthorizationConfig>) => (queryOrBody: {tenant: string, scope:string}, user: UserAuthorization) => {
  if (
    (configStream().useTenants && (!queryOrBody.tenant) && user?.resources?.tenants !== true) ||
    (configStream().useScopes && (!queryOrBody.scope) && user?.resources?.scopes !== true)
  )
    return Async.Rejected(createError(UnauthorizedError, null))
  return Async.of(queryOrBody);
}

export function create(params: AuthorizationServiceParams) {
  const {serverComponents, u, configStream} = params;
  const {eventsourcing, endpoint, database:{mongo}} = serverComponents;
  eventsourcing.routeCommandHandler(UsersAuthorizationSystem(params), AuthorizationCommands);
  eventsourcing.routeCommandHandler(RolesSystem(params), AuthorizationCommands);
  // eventsourcing.routeEventHandler(RolesProjector(params), AuthorizationEvents);
  eventsourcing.routeEventHandler(UsersAuthorizationProjector(params), AuthorizationEvents);

  const getRoles = (roles?: (string|Role)[], {tenant, scope, excludeDisabled}: FilterRoleParams = {scope: 'default'}) =>
    Async.of(roles)
      .map(roles => roles.map(r=> isString(r) ? {name: r, scope, tenant} : r))
      .chain(roles =>   
        mongo.getCollection(configStream().mongo.rolesCollection, configStream().mongo.instance)
          .read(Object.assign({$or: roles}, !excludeDisabled ? {disabled: {$exists: false}} : {})) as Async<Role[]>
      )
    
  const getUserAuthorization = (username?: string) =>
    mongo.getCollection(configStream().mongo.usersCollection, configStream().mongo.instance)
      .read({username})
      .map(records => records.length <= 1 ? records[0] as UserAuthorization : records as UserAuthorization[])

  endpoint.registerEndpoint({
    module: 'Authorization',
    name: 'Read Roles',
    description: 'Read Roles definitions',
    route: '/authorization-roles',
    method: 'GET',
    isHttp: true,
    requiresAuth: true,
    schemas:{
      query: joi.object().keys({
        scope: joi.string().optional(),
        tenant: joi.string().optional(),
        roles: joi.array().items(joi.string()).optional(),
        filterDisabled: joi.boolean().optional()
      })
    },
    action: ({query, context:{user}}) => 
      authorizeRolesActions(configStream)(u.pick(['tenant', 'scope'], query) as Role, user)
        .chain(query => getRoles(query.roles, {tenant: query.tenant, scope: query.scope, excludeDisabled: query.filterDisabled}))
  });

  endpoint.registerEndpoint({
    module: 'Authorization',
    name: 'Read User\'s Authorization',
    description: 'Reads user\'s Authorization',
    route: '/users-authorization/:username?',
    method: 'GET',
    isHttp: true,
    requiresAuth: true,
    action: ({params, context:{user}}) =>
      authorizeUsersActions(eventsourcing, configStream)(params.username, user)
        .chain(() => getUserAuthorization(params.username))
  });
}