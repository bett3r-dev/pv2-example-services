import { Async, constant, isString } from "@bett3r-dev/crocks"
import { MongoDatabaseProvider } from "@bett3r-dev/database-mongo"
import { FilterRoleParams, LocalAuthorizationStore } from ".."
import { Role, UserAuthorization } from "@bett3r-dev/server-core";

export type MongoAuthenticationConfig = {
  instance: string,
  usersCollection: string,
  rolesCollection: string
}

export const create = (mongo: MongoDatabaseProvider, config: MongoAuthenticationConfig): LocalAuthorizationStore => {
  const init = () => {
    mongo.databaseConnectedStream.map(val => {
      if (val){
        mongo.getCollection(config.usersCollection).ensureIndex({'username': 1}, {unique: true})
        mongo.getCollection(config.rolesCollection).ensureIndex({'scope': 1, 'tenant': 1, 'name': 1}, {unique: true})
      }
    })
    return Async.of();
  }

  const getUserAuthorization = (username?: string) =>
    mongo.getCollection(config.usersCollection, config.instance)
      .read({username})
      .map(records => records.length <= 1 ? records[0] as UserAuthorization : records as UserAuthorization[])
  
  const storeUserAuthorization = (userAuthorization: UserAuthorization) =>
    mongo.getCollection(config.usersCollection, config.instance)
      .upsert({id: userAuthorization.username}, {$set:userAuthorization})
      .map(constant(userAuthorization))

  const getRoles = (roles?: (string|Role)[], {tenant, scope, excludeDisabled}: FilterRoleParams = {scope: 'default'}) =>
    Async.of(roles)
      .map(roles => roles.map(r=> isString(r) ? {name: r, scope, tenant} : r))
      .chain(roles =>   
        mongo.getCollection(config.rolesCollection, config.instance)
          .read(Object.assign({$or: roles}, !excludeDisabled ? {disabled: {$exists: false}} : {})) as Async<Role[]>
      )

  const storeRole = (role: Role) => 
    mongo.getCollection(config.rolesCollection, config.instance)
      .upsert({name: role.name, scope: role.scope || 'default', tenant: role.tenant}, {$set: role})
      .map(constant(role))
  
  
  return {
    init,
    getUserAuthorization,
    storeUserAuthorization,
    getRoles,
    storeRole
  }
}
