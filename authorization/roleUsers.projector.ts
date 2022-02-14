import { Async } from '@bett3r-dev/crocks';
import { Projector } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { AuthorizationServiceParams } from '.';
// import { UserAuthorizationModel, UserAuthorizationEvents } from 'src/domain'
import * as AuthorizationEvents from './authorization.events';

export const RoleUsers = (params: AuthorizationServiceParams) : Projector<typeof AuthorizationEvents> => {
  const {serverComponents, u, configStream} = params;
  const {database: {mongo}} = serverComponents;

  return ({
    name: 'RoleUsers',
    eventProjectors: {
      UserAuthorizationUpserted: (event) =>
        mongo.getCollection(configStream().mongo.rolesCollection, configStream().mongo.instance)
          //FIXME: Me quede en projectar los usuarios por roles.
          //FIXME: Ver de dejar en el server components solamente el middleware
          .upsert(event.data.roles)
    }
  })
}