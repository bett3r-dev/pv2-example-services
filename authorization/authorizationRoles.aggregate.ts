import { constant } from '@bett3r-dev/crocks';
import { Aggregate, Role } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams, authorizeRolesActions } from '.';
import {AuthorizationCommands, AuthorizationEvents} from '@bett3r-dev/pv2-example-domain';

export const AuthorizationRoles = ({serverComponents, configStream, u}: AuthorizationServiceParams) : Aggregate<Role, Pick<typeof AuthorizationCommands, 'UpsertRole'>, Pick<typeof AuthorizationEvents, 'RoleUpserted'>> => {
  const {eventsourcing:{createEvent}, endpoint} = serverComponents;
  


  return ({
    name: 'AuthorizationRoles',
    eventReducers:{
      RoleUpserted: (state, data) =>  u.mergeDeepRight(state || {}, data),
    },
    commandHandlers: {
      UpsertRole: (state, data, {context: {user}}) => {
        return authorizeRolesActions(configStream)(data, user)
          .map(constant([createEvent(AuthorizationEvents.RoleUpserted, data)]))
      }
    }
  })
}