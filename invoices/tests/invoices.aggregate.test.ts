import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { InvoicesAggregate } from '../invoices.aggregate';
import {InvoiceCommands, InvoiceEvents} from '@bett3r-dev/pv2-example-domain';

describe('InvoicesAggregate', () => {
  const { createTestEnvironment } = testing
  let es: testing.EventSourcingTest;
  let params: AppServiceParams
  let mockCall: jest.Mock = jest.fn();
  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es, endpoint: {
      registerEndpoint: () => {},
      registerBasicEndpoints: ()=>{},
      registerMiddleware: ()=>{},
      call: mockCall
    }}};
  })

  describe('CreateInvoice', () => {
    //TODO: de aca para abajop
    it('Given no previous events, when CreateInvoice then InvoiceCreated', done => {
      // es.testAggregate(InvoicesAggregate(params))
      //   .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
      //   .when(InvoiceCommands.CreateUserInvoice, null)
      //   .then({events:[es.createCommittedEvent(
      //     InvoiceEvents.UserInvoiceCreated, null)], state:{}})
      //   .fork(done, () => done())
    });



  });
});
