import { PaymentEvents } from '@bett3r-dev/pv2-example-domain';
import { Projector } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const UserPaymentsProjectors = (params: AppServiceParams) : Projector<typeof PaymentEvents> => {
  const {serverComponents:{database:{mongo}}, u} = params;


  return ({
    name: 'UserPayments',
    eventProjectors: {
      PaymentStarted: (event) =>
        mongo.getCollection('user-payments').upsert({id: event.metadata.id}, {$set: {status: 'new', ...event.data, lastEvent: event}}),
      PaymentApproved: (event) =>
        mongo.getCollection('user-payments').upsert({id: event.metadata.id}, {$set: {status: 'approved', lastEvent: event}}),
      PaymentRejected: (event) =>
        mongo.getCollection('user-payments').upsert({id: event.metadata.id}, {$set: {status: 'rejected', reason: event.data.reason, lastEvent: event}}),
    }
  })
}
