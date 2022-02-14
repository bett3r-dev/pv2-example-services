import { constant } from '@bett3r-dev/crocks';
import { System } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams, authorizeUsersActions } from '.';
import * as AuthorizationCommands from './authorization.commands';
import * as AuthorizationEvents from './authorization.events';

export const UsersAuthorization = ({serverComponents, configStream}: AuthorizationServiceParams) : System<Pick<typeof AuthorizationCommands, 'UpsertUserAuthorization'>, typeof AuthorizationEvents> => {
  const {eventsourcing} = serverComponents;

  return ({
    name: 'UsersAuthorization',
    isStreamable: true,
    commandHandlers: {
      UpsertUserAuthorization: (data, {context: {user}}) => 
        authorizeUsersActions(eventsourcing, configStream)(data.username, user)
          .map(constant([eventsourcing.createEvent(AuthorizationEvents.UserAuthorizationUpserted, data)]))
    }
  })
}