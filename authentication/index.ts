import {AppServiceParams} from 'src/types';
import { AuthenticationSystem } from './authentication.system';
import * as AuthenticationCommands from './authentication.commands';
import { UserAuth } from '@bett3r-dev/server-core';
import { constant } from '@bett3r-dev/crocks';

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing, hook}, u} = params;

  hook.onHookAsync('Authentication', 'userRegistred', (user: UserAuth) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.RegisterUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  hook.onHookAsync('Authentication', 'userLoggedIn', (user: UserAuth) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.LoginUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  hook.onHookAsync('Authentication', 'userLoggedOut', (user: UserAuth) => {
    return eventsourcing.executeCommand(AuthenticationSystem(params), AuthenticationCommands.LogoutUser)({body: u.pick(['username'], user), params:{id:user.username}})
      .map(constant(user));
  })
  eventsourcing.routeCommandHandler(AuthenticationSystem(params), AuthenticationCommands);
}