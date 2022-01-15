import { CartEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { UserCartsProjectors } from "./userCarts.projectors";

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing, endpoint, database:{mongo}}, u} = params;
  eventsourcing.routeProjector(UserCartsProjectors(params), CartEvents);
  endpoint.registerEndpoint({
    method: 'GET',
    module: 'UserCartsReadModel',
    route: '/user-carts/readmodel/:id',
    name: 'user carts readmodel',
    description: 'get user cart',
    requiresAuth: false,
    isHttp: true,
    action: ({body, query, params}) =>{
      return mongo
        .getCollection('user-carts')
        .read({...query, ...params})
    }
})
}
