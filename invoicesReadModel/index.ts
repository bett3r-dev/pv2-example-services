import { InvoiceEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { InvoicesProjector } from './invoices.projectors';

export function create(params: AppServiceParams) {
  const {serverComponents:{eventsourcing, endpoint, database:{mongo}}} = params;

  eventsourcing.routeProjector(InvoicesProjector(params), InvoiceEvents);

  endpoint.registerEndpoint({
    module: 'InvoicesReadModel',
    name: 'Read Invoices',
    description: 'Reads Invoices',
    route: '/invoices',
    method: 'GET',
    requiresAuth: false,
    isHttp: true,
    action: ({ params, query }) =>
      mongo.getCollection('invoices').read({...params, ...query})
  });
}
