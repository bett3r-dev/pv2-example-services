import { ProductCommands } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
// import { PaymentStartedPolicy } from './paymentResult.policy';
import { ProductsAggregate } from './products.aggregate';

export function create(params: AppServiceParams) {
  const { serverComponents, u } = params;
  serverComponents.eventsourcing.routeCommandHandler(ProductsAggregate(params), ProductCommands);
  // serverComponents.eventsourcing.routeEventHandler(PaymentRejectedPolicy(params), PaymentEvents)
  // serverComponents.eventsourcing.routeEventHandler(PaymentStartedPolicy(params), PaymentEvents)
}