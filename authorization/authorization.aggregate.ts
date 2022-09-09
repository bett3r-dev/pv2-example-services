import { constant } from '@bett3r-dev/crocks';
import { Aggregate, UserAuthorization } from '@bett3r-dev/server-core';
import { AuthorizationServiceParams, authorizeUsersActions } from '.';
import {AuthorizationCommands, AuthorizationEvents} from '@bett3r-dev/pv2-example-domain';

export const Authorization = ({serverComponents, configStream, u}: AuthorizationServiceParams) : Aggregate<UserAuthorization, Pick<typeof AuthorizationCommands, 'UpsertUserAuthorization'>, Pick<typeof AuthorizationEvents, 'UserAuthorizationUpserted'>> => {
  const {eventsourcing} = serverComponents;

  return ({
    name: 'Authorization',
    eventReducers: {
      UserAuthorizationUpserted: (state, data) =>  u.mergeDeepRight(state || {}, data),
    },
    commandHandlers: {
      UpsertUserAuthorization: (state, data, {context: {user}}) => 
        authorizeUsersActions(eventsourcing, configStream)(data.username, user)
          .map(constant([eventsourcing.createEvent(AuthorizationEvents.UserAuthorizationUpserted, data)])),
    }   
  })
}