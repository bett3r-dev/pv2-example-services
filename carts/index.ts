import { CartCommands, PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { CartsAggregate } from './carts.aggregate';
import { PurchaseApprovedPolicy } from './purchaseApproved.policy';

export function create(params: AppServiceParams) {
  const { serverComponents, u } = params;
  serverComponents.eventsourcing.routeCommandHandler(CartsAggregate(params), CartCommands);
  serverComponents.eventsourcing.routeEventHandler(PurchaseApprovedPolicy(params), PaymentEvents);
}