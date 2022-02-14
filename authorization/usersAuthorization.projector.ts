import { Projector, CommittedEvent } from '@bett3r-dev/server-core';
import { Async } from '@bett3r-dev/crocks';
import { AppServiceParams } from 'src/types';
// import { UserAuthorizationModel, UserAuthorizationEvents } from 'src/domain'
import * as AuthorizationEvents from './authorization.events'

export const UsersAuthorization = (params: AppServiceParams) : Projector<typeof AuthorizationEvents> => {
  const {serverComponents, u} = params;
  const {cache} = serverComponents;

  return ({
    name: 'UsersAuthorization',
    eventProjectors: {
      UserAuthorizationUpserted: (event) =>
        Async.of(undefined)
    }
  })
}