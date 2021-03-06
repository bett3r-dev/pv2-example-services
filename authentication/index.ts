import {AppServiceParams} from 'src/types';
import { AuthenticationSystem } from './authentication.system';
import * as AuthenticationCommands from './authentication.commands';
import { UserAuthentication } from '@bett3r-dev/server-core';
import { constant } from '@bett3r-dev/crocks';

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing, hook}, u} = params;

  hook.onHookAsync('Authentication', 'userRegistered', (user: UserAuthentication) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.RegisterUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  hook.onHookAsync('Authentication', 'userLoggedIn', (user: UserAuthentication) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.LoginUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  hook.onHookAsync('Authentication', 'userLoggedOut', (user: UserAuthentication) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.LogoutUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  eventsourcing.routeCommandHandler(AuthenticationSystem(params), AuthenticationCommands);
}