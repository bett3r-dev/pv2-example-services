import { Projector } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';
import { InvoiceEvents } from '@bett3r-dev/pv2-example-domain';

export const InvoicesProjector = (params: AppServiceParams) : Projector<typeof InvoiceEvents> => {
  const {serverComponents, u} = params;
  const mongo = serverComponents.database.mongo;

  return ({
    name: 'Invoices',
    eventProjectors: {
      InvoiceCreated: (event) =>
        mongo.getCollection('invoices').upsert({id: event.metadata.id}, {$set:{...event.data, lastEvent: event}})
    }
  })
}
