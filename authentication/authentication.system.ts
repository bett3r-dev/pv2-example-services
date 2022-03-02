import { System } from '@bett3r-dev/server-core';
import { Async } from '@bett3r-dev/crocks';
import { AppServiceParams } from 'src/types';
import * as AuthenticationCommands from './authentication.commands';
import * as AuthenticationEvents from './authentication.events';

export const AuthenticationSystem = ({serverComponents, u}: AppServiceParams) : System<typeof AuthenticationCommands, typeof AuthenticationEvents> => {
  const {eventsourcing:{createEvent}} = serverComponents;

  return ({
    name: 'Authentication',
    isStreamable: true,
    commandHandlers: {
      RegisterUser: (data) =>
        Async.of([createEvent(AuthenticationEvents.UserRegistered, data)]),
      LoginUser: (data) =>
        Async.of([createEvent(AuthenticationEvents.UserLoggedIn, data)]),
      LogoutUser: (data) =>
        Async.of([createEvent(AuthenticationEvents.UserLoggedOut, data)]), 
    }
  })
}