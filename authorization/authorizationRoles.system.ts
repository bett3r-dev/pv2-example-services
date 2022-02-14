import { constant } from '@bett3r-dev/crocks';
import { System } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams, authorizeRolesActions } from '.';
import * as AuthorizationCommands from './authorization.commands';
import * as AuthorizationEvents from './authorization.events';

export const AuthorizationRoles = ({serverComponents, configStream}: AuthorizationServiceParams) : System<Pick<typeof AuthorizationCommands, 'UpsertRole'>, typeof AuthorizationEvents> => {
  const {eventsourcing:{createEvent}} = serverComponents;

  return ({
    name: 'AuthorizationRoles',
    isStreamable: true,
    commandHandlers: {
      UpsertRole: (data, {context: {user}}) => 
        authorizeRolesActions(configStream)(data, user)
          .map(constant([createEvent(AuthorizationEvents.RoleUpserted, data)]))
    }
  })
}