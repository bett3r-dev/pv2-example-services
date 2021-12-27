import { Async, constant } from '@bett3r-dev/crocks';
import { UserModel } from '@bett3r-dev/pv2-example-domain';
import { EndpointAction } from '@bett3r-dev/server-core';
import {AppServiceParams} from 'src/types';

export function create(params: AppServiceParams) {
  const {serverComponents: {endpoint, database}, u} = params;
  const mongo = database.mongo;

  endpoint.registerEndpoint({
    module: 'Users',
    name: 'Read user',
    description: 'Reads user by given id',
    route: '/users/:id',
    method: 'GET',
    isHttp: true,
    action: ({ params }) =>
      mongo.getCollection('users').read({id: params.id})
        .map(arr => arr[0])
  })
  
  endpoint.registerEndpoint({
    module: 'Users',
    name: 'Read user',
    description: 'Reads user by given id',
    route: '/users',
    method: 'GET',
    isHttp: true,
    action: ({ params, query }) =>
      mongo.getCollection('users').read({...query})
  })
  
  endpoint.registerEndpoint({
    module: 'Users',
    name: 'Read Users',
    description: 'Reads Users',
    route: '/users/:id',
    method: 'POST',
    isHttp: true,
    action: (({body, params}) => {
      return mongo.getCollection('users').upsert<UserModel>({id: params.id}, {$set:{...body, id: params.id}})
        .map(arr => arr[0])
    }) as EndpointAction<UserModel>
  })
  
  endpoint.registerEndpoint({
    module: 'Users',
    name: 'Remove user',
    description: 'Removes user',
    route: '/users/:id',
    method: 'DELETE',
    isHttp: true,
    action: ({ params }) =>
      mongo.getCollection('users').destroy({id: params.id})
        .map(constant(params.id))  
  })

}