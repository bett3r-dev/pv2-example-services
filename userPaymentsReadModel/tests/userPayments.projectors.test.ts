import * as u from '@bett3r-dev/server-utils';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { AppServiceParams } from 'src/types';
import { UserPaymentsProjectors } from '../userPayments.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import {Async} from '@bett3r-dev/crocks';
import { PaymentEvents } from 'src/domain/src/payment';
import { CartEvents, ProductEvents } from '@bett3r-dev/pv2-example-domain';

const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set?: T, $addToSet?: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, {...data.$set, ...data.$addToSet, ...filter});
    return Async.of();
  })
})

describe( 'UserPaymentProjector', function() {
  const { createTestEnvironment } = testing
  let es: testing.EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);


  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
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

  it('Given no previous events, when PaymentStarted then Payment is inserted in DB with status new', done => {
    es.testProjector(UserPaymentsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(CartEvents.ProductAdded, {
        productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        productInfo: {
        sku: "sku",
        name: "name",
        price: 100
        },
        quantity: 2
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
    ])
      .when(PaymentEvents.PaymentStarted, {
        cartId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        cart: {
          products:{
            "6ed258fe-4e88-4e8c-8e53-e11e8635ccec":{
              productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
              productInfo: {
              sku: "sku",
              name: "name",
              price: 100
              },
              quantity: 2
            }
          },
        },
          amount: 100,
      }, {id: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      .map(() => {
        assert.equal(mockState.length, 1);
        // assert.deepNestedInclude(mockState[0], {'userpaymentreadmodel'});
      })
      .fork(done, () => done())
  });
  it('Given PaymentStarted, when PaymentApproved then Payment is upserted in DB with status approved', done => {
    es.testProjector(UserPaymentsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(CartEvents.ProductAdded, {
        productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        productInfo: {
        sku: "sku",
        name: "name",
        price: 100
        },
        quantity: 2
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(PaymentEvents.PaymentStarted, {
        cartId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        cart: {
          products:{
            "6ed258fe-4e88-4e8c-8e53-e11e8635ccec":{
              productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
              productInfo: {
              sku: "sku",
              name: "name",
              price: 100
              },
              quantity: 2
            }
          },
        },
          amount: 100,
      }, {id: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    ])
      .when(PaymentEvents.PaymentApproved,{cartId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}, {id: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      .map(() => {
        assert.equal(mockState.length, 1);
        // assert.deepNestedInclude(mockState[0], {'userpaymentreadmodel'});
      })
      .fork(done, () => done())
  });
  it('Given PaymentStarted, when PaymentRejected then Payment is upserted in DB with status rejected', done => {
    es.testProjector(UserPaymentsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(CartEvents.ProductAdded, {
        productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        productInfo: {
        sku: "sku",
        name: "name",
        price: 100
        },
        quantity: 2
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(PaymentEvents.PaymentStarted, {
        cartId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        cart: {
          products:{
            "6ed258fe-4e88-4e8c-8e53-e11e8635ccec":{
              productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
              productInfo: {
              sku: "sku",
              name: "name",
              price: 100
              },
              quantity: 2
            }
          },
        },
          amount: 100,
      }, {id: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    ])
      .when(PaymentEvents.PaymentRejected,{cartId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec", reason: "reason"}, {id: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      .map(() => {
        assert.equal(mockState.length, 1);
        // assert.deepNestedInclude(mockState[0], {'userpaymentreadmodel'});
      })
      .fork(done, () => done())
  });
});
