import { CartEvents, InvoiceCommands } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { ClosedCartPolicy } from './closedCart.policy';
import { InvoicesAggregate } from './invoices.aggregate';

export function create(params: AppServiceParams) {
  const { serverComponents, u } = params;
  serverComponents.eventsourcing.routeCommandHandler(InvoicesAggregate(params), InvoiceCommands);
  serverComponents.eventsourcing.routePolicy(ClosedCartPolicy(params), CartEvents)
}