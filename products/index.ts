import { PaymentEvents, ProductCommands } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { PaymentRejectedPolicy } from './paymentRejected.policy';
import { PaymentStartedPolicy } from './paymentStarted.policy';
import { ProductsAggregate } from './products.aggregate';

export function create(params: AppServiceParams) {
  const { serverComponents, u } = params;
  serverComponents.eventsourcing.routeAggregate(ProductsAggregate(params), ProductCommands);
  serverComponents.eventsourcing.routePolicy(PaymentRejectedPolicy(params), PaymentEvents)
  serverComponents.eventsourcing.routePolicy(PaymentStartedPolicy(params), PaymentEvents)
}