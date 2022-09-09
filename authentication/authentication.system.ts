import { System } from '@bett3r-dev/server-core';
import { Async } from '@bett3r-dev/crocks';
import { AppServiceParams } from 'src/types';
import {AuthenticationCommands, AuthenticationEvents} from '@bett3r-dev/pv2-example-domain';

export const AuthenticationSystem = ({serverComponents, u}: AppServiceParams) : System<typeof AuthenticationCommands, typeof AuthenticationEvents> => {
  const {eventsourcing:{createEvent}} = serverComponents;

  return ({
    name: 'Authentication',
    isStreamable: true,
    commandHandlers: {
      RegisterUser: (state, data) =>
        Async.of([createEvent(AuthenticationEvents.UserRegistered, data)]),
      LoginUser: (state, data) =>
        Async.of([createEvent(AuthenticationEvents.UserLoggedIn, data)]),
      LogoutUser: (state, data) =>
        Async.of([createEvent(AuthenticationEvents.UserLoggedOut, data)]), 
    }
  })
}