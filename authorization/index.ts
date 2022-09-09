//FIXME: Me quede en 
/*
  que pasa si no tenemos cache
  que pasa si el server se muere, es posible que estemos logueados pero no en cache?, que pasa si eso pasa?
*/
import { Async, isString, pipeK } from '@bett3r-dev/crocks';
import { AuthenticationEvents, AuthorizationCommands, AuthorizationEvents } from '@bett3r-dev/pv2-example-domain';
import { AuthorizationConfig, createError, Endpoint, EventSourcingManager, Role, UnauthorizedError, UserAuthorization } from '@bett3r-dev/server-core';
import joi from 'joi';
import { AppServiceParams } from 'src/types';
import { AuthorizationRoles } from './authorizationRoles.aggregate';
import { Authorization } from './authorization.aggregate';
import { UsersAuthorization as UsersAuthorizationProjector } from './usersAuthorization.projector';
import { Roles } from './roles.projector';
import { MongoDatabaseProvider } from '@bett3r-dev/database-mongo';
import { assoc, mergeAll } from '@bett3r-dev/server-utils';

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
  return eventsourcing.loadStream(Authorization, {direction: 'backwards', limit: 1, from: 'end'})(username)
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

export const getRoles = 
(mongo: MongoDatabaseProvider, rolesCollection: string, mongoInstance: string) => 
(roles?: (string|Role)[], {tenant, scope, excludeDisabled}: FilterRoleParams = {scope: 'default'}) =>
  Async.of(roles)
    .map(roles => roles.map(r=> isString(r) ? {name: r, scope, tenant} : r))
    .chain(roles =>   
      mongo.getCollection(rolesCollection, mongoInstance)
        .read(Object.assign({$or: roles}, !excludeDisabled ? {disabled: {$exists: false}} : {})) as Async<Role[]>
    )
  
export const getUserAuthorization = 
(mongo: MongoDatabaseProvider, usersCollection: string, mongoInstance: string) => 
(username?: string) =>
  mongo.getCollection(usersCollection, mongoInstance)
    .read({username})
    .map(records => records.length <= 1 ? records[0] as UserAuthorization : records as UserAuthorization[])


export const coerceUserPermissions = 
(mongo: MongoDatabaseProvider, rolesCollection: string, mongoInstance: string) => 
(userAuthorization: UserAuthorization) => {
  return !userAuthorization.roles ? Async.of(userAuthorization) : getRoles(mongo, rolesCollection, mongoInstance)(userAuthorization.roles)
  .map((roles: Role[]) => mergeAll(roles.map(r=>r.permissions)))
  .map(rolesPermissions => Object.assign(rolesPermissions, userAuthorization.permissions || {}))
  .map(permissions => assoc('permissions', permissions, userAuthorization))
}

export function create(params: AuthorizationServiceParams) {
  const {serverComponents, u, configStream} = params;
  const {eventsourcing, endpoint, database:{mongo}, hook, authorization} = serverComponents;
  eventsourcing.routeCommandHandler(Authorization(params), AuthorizationCommands);
  eventsourcing.routeCommandHandler(AuthorizationRoles(params), AuthorizationCommands);
  eventsourcing.routeEventHandler(Roles(params), AuthorizationEvents);
  eventsourcing.routeEventHandler(UsersAuthorizationProjector(params), {
    ...AuthorizationEvents, 
    ...u.pick([
      'UserLoggedIn',
      'UserLoggedOut'
    ], AuthenticationEvents)
  });

  hook.onHook('http', 'onRegisterHttpEndpoint', 1001, (endpoint: Endpoint) => {
    if (endpoint.requiresAuth === true){
      endpoint.action = pipeK(
        authorization.authorizeRequest,
        endpoint.action
      ) 
    }
    return endpoint;
  })
  hook.onHookAsync('Authentication', 'generateUserToken', (user: UserAuthorization) => 
    getUserAuthorization(mongo, configStream().mongo.usersCollection, configStream().mongo.instance)(user.username)
  )

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
        .chain(query => getRoles(mongo, configStream().mongo.rolesCollection, configStream().mongo.instance)(query.roles, {tenant: query.tenant, scope: query.scope, excludeDisabled: query.filterDisabled}))
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
        .chain(() => getUserAuthorization(mongo, configStream().mongo.usersCollection, configStream().mongo.instance)(params.username))
  });
}