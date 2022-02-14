import { Async, isString } from "@bett3r-dev/crocks";
import { pick } from "@bett3r-dev/server-utils";
import { FilterRoleParams, LocalAuthorizationStore } from "..";
import { Role, UserAuthorization } from "@bett3r-dev/server-core";

export const create = (): LocalAuthorizationStore => {
  const store: {roles: Role[], users: Record<string, UserAuthorization>} = {
    roles: [],
    users: {}
  };
  
  const getUserAuthorization = (username?: string) =>
    Async.of(username ? store.users[username] : Object.values(store.users))
  
  const storeUserAuthorization = (userAuth: UserAuthorization) =>{
    store[userAuth.username] = userAuth;
    return Async.of(userAuth)
  }

  const getRoles = (roles?:(string | Role)[], {tenant, scope, excludeDisabled}: FilterRoleParams = {}) =>
    Async.of(roles)
      .map(roles => roles.map(r=> isString(r) ? {name: r, scope, tenant} : r))
      .map(roles => store.roles.filter(r=>
        roles.some(_r => {
          (_r.name === r.name) &&
          (tenant ? _r.tenant === r.tenant : true) &&
          (scope ? _r.scope === r.scope : true) &&
          (excludeDisabled ? !r.disabled : true)
        })
      ))    

  const storeRole = (role: Role) => {
    store.roles.push(role);
    return Async.of(role);
  }

  return {
    init: () => Async.of(),
    getUserAuthorization,
    storeUserAuthorization,
    getRoles,
    storeRole
  }
}
