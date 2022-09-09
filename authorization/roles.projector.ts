import { Projector, Role } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams } from '.';
import {AuthorizationEvents} from '@bett3r-dev/pv2-example-domain';

export const Roles = (params: AuthorizationServiceParams) : Projector<typeof AuthorizationEvents> => {
  const {serverComponents, u, configStream} = params;
  const {database: {mongo}} = serverComponents;
  const roleUsersCollection = 'role-users-projection';

  return ({
    name: 'Roles',
    eventProjectors: {
      RoleUpserted: (event) =>
        mongo.getCollection(configStream().mongo.rolesCollection, configStream().mongo.instance)
          .upsert({name: event.data.name, tenant: event.data.tenant, scope: event.data.scope}, {$set: event.data})
          .map(u.noop)
    }
  })
}