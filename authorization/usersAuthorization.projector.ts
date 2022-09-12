import { Async, constant, isDefined } from '@bett3r-dev/crocks';
import { AuthenticationEvents, AuthorizationEvents } from '@bett3r-dev/pv2-example-domain';
import { Projector, UserAuthorization } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams, coerceUserPermissions } from '.';

export const UsersAuthorization = (params: AuthorizationServiceParams) : Projector<typeof AuthorizationEvents | typeof AuthenticationEvents> => {
  const {serverComponents, u, configStream} = params;
  const {cache, database:{mongo}} = serverComponents;

  mongo.databaseConnectedStream.map(val => {
    if (val){
      mongo.getCollection(configStream().mongo.usersCollection).ensureIndex({'username': 1}, {unique: true});
      mongo.getCollection(configStream().mongo.usersCollection).ensureIndex({'roles': 1});
      mongo.getCollection(configStream().mongo.rolesCollection).ensureIndex({'scope': 1, 'tenant': 1, 'name': 1}, {unique: true});
    }
  })

  const setCoercedPermissionsInCache = (username: string) => (userAuthorization: UserAuthorization) =>
    Async.of(userAuthorization)
      .chain(coerceUserPermissions(mongo, configStream().mongo.rolesCollection, configStream().mongo.instance))
      .chain((userAuthorization: UserAuthorization) => cache.set(`user-authorization:${username}`, userAuthorization, configStream().cache.expiration))

  return ({
    name: 'UsersAuthorization',
    eventProjectors: {
      UserLoggedIn: (event) =>
        mongo.getCollection(configStream().mongo.usersCollection, configStream().mongo.instance)
          .read({username: event.data.username})
          .map(users => users[0])
          .chain(setCoercedPermissionsInCache(event.data.username))
          .map(u.noop),
      
      UserLoggedOut: (event) =>
        cache.remove(`user-authorization:${event.data.username}`),
      
      UserAuthorizationUpserted: (event) => {
        const collection = mongo.getCollection(configStream().mongo.usersCollection, configStream().mongo.instance);
        return collection  
          .read({username: event.data.username})
          .map((userAuthorization: UserAuthorization[]) => u.mergeDeepRight(userAuthorization[0] || {}, event.data))
          .chain((userAuthorization: UserAuthorization) => {
            return collection.upsert({username: event.data.username}, {$set: userAuthorization})
              .map(constant(userAuthorization))
          })
          .map((userAuthorization: UserAuthorization) => {
            cache.get(`user-authorization:${userAuthorization}`)
              .chain(u.safeAsync(isDefined))
              .chain((userAuthorization: UserAuthorization) => cache.set(`user-authorization:${event.data.username}`, userAuthorization, configStream().cache.expiration))
              .bimap<void, void>(u.noop, u.noop)
          })
      },
      
      RoleUpserted: (event) =>
        //FIXME: Falta este
        Async.of(undefined),
    }
  })
}