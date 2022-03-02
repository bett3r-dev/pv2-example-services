import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { Async } from '@bett3r-dev/crocks';
import sinon from 'sinon';
import { assert } from 'chai';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { PurchaseApprovedPolicy } from '../purchaseApproved.policy';
import { PaymentApproved } from 'src/domain/src/payment/payment.events';
import { CartCommands } from '@bett3r-dev/pv2-example-domain';

const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, data.$set);
    return Async.of();
  })
})

describe( 'PurchaseApproved.policy', function() {
  const { createTestEnvironment } = testing
  let es: testing.EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);
  let mockCall: jest.Mock = jest.fn();


  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
      u,
      serverComponents: {
        eventsourcing: es,
        database:{
          //@ts-ignore
          mongo: {getCollection: () => mongo}
        },
        endpoint: {
          registerEndpoint: () => {},
          registerBasicEndpoints: ()=>{},
          registerMiddleware: ()=>{},
          call: mockCall
        }
      }
    };
  })

  afterEach(() => {
    sinon.resetHistory();
    mockState.splice(0);
  })

  it('Given no previous events, when PaymentApproved then CloseCart', done => {
    mockCall.mockImplementationOnce(()=> Async.of({}))
    es.testPolicy(PurchaseApprovedPolicy(params))
      .when(PaymentApproved,{cartId: "86abf381-4a30-4e51-bbea-9ad9abbcc2df"})
      .then([es.createCommand(CartCommands.CloseCart, null)])
      .fork(done, () => done())
  });


});
