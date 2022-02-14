import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { Async } from '@bett3r-dev/crocks';
import sinon from 'sinon';
import { assert } from 'chai';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { PaymentStartedPolicy } from '../paymentStarted.policy';
import { PaymentsAggregate } from '../payments.aggregate';
import {PaymentCommands, PaymentEvents} from '@bett3r-dev/pv2-example-domain';

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

describe( 'PaymentStarted.policy', function() {
  const { createTestEnvironment } = testing
  let es: testing.EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);




  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
      u,
      serverComponents: {
        eventsourcing: es,
        database:{
          //@ts-ignore
          mongo: {getCollection: () => mongo}
        }
      }
    };
  })

  afterEach(() => {
    sinon.resetHistory();
    mockState.splice(0);
  })

  it('Given no previous events, when PaymentStarted then Pay', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testPolicy(PaymentStartedPolicy(params))
      .when(PaymentEvents.PaymentStarted, {
        cartId: '5832ac10-8efd-4d15-ac14-f70e802a6b2c',
        cart:{
          products:{
            "77fbf762-07ed-48ed-8780-87336d40ee8e":{
              productId: "77fbf762-07ed-48ed-8780-87336d40ee8e",
              productInfo:{
                name: "name",
                price: 100,
                sku: "sku",
              },
              quantity: 1,
            },
          },
        },
        amount: 100
      },{id})
      .then([es.createCommand(PaymentCommands.Pay, undefined)]) //TODO: esto deberia ser otra cosa pero no me deja
      .fork(done, () => done())
  });


});
