import { PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { UserPaymentsProjectors } from "./userPayments.projectors";

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing, endpoint, database:{mongo}}, u} = params;
  eventsourcing.routeEventHandler(UserPaymentsProjectors(params), PaymentEvents);
  endpoint.registerEndpoint({
    method: 'GET',
    module: 'UserPaymentsReadModel',
    route: '/user-payments/readmodel/:id',
    name: 'user payments readmodel',
    description: 'get user payment',
    requiresAuth: false,
    action: ({body, query, params}) =>{
      return mongo
        .getCollection('user-payments')
        .read({...query, ...params})
    }
})
}
