import * as u from '@bett3r-dev/server-utils';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { AppServiceParams } from 'src/types';
import { UserCartsProjectors } from '../userCarts.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import {Async} from '@bett3r-dev/crocks';
import { CartEvents } from 'src/domain/src/cart';
import { ProductEvents } from '@bett3r-dev/pv2-example-domain';
import { QuantityUpdated } from '../../../domain/src/cart/cart.events';

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

describe( 'UserCartProjector', function() {
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

  it.only('Given ProductCreated and userCartCreated, when ProductAdded then Product is added to UserCart in DB', done => {
    es.testProjector(UserCartsProjectors(params))
      .given([ //TODO: problema cuando es más de un evento?
        es.createCommittedEvent(CartEvents.UserCartCreated, {
          userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
        }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
        es.createCommittedEvent(ProductEvents.ProductCreated, {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      ])
      .when(CartEvents.ProductAdded, {
        productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
        productInfo: {
        sku: "sku",
        name: "name",
        price: 100
        },
        quantity: 2
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      .map(() => {
        assert.equal(mockState.length, 1);
        // assert.deepNestedInclude(mockState[0], {
        //   sku: "sku",
        //   name: "name",
        //   price: 100,
        //   quantity: 100
        // });
      })
      .fork(done, () => done())
  });

  it('Given ProductAdded, when QuantityUpdated then Product quantity is updated in DB', done => {
    es.testProjector(UserCartsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    ])
    .when(CartEvents.QuantityUpdated, {
      productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec",
      quantity: 10
    }
    , {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    .map(() => {
      assert.equal(mockState.length, 1);
      // assert.deepNestedInclude(mockState[0], {
      //   sku: "sku",
      //   name: "name",
      //   price: 100,
      //   quantity: 10
      // });
    })
    .fork(done, () => done())
  });
  it('Given ProductAdded, when ProductRemoved then Product is removed from UserCart in DB', done => {
    es.testProjector(UserCartsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    ])
    .when(CartEvents.ProductRemoved, {
      productId: "6ed258fe-4e88-4e8c-8e53-e11e8635ccec"
    }
    , {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    .map(() => {
      assert.equal(mockState.length, 0);
      // assert.deepNestedInclude(mockState[0], {
      //   sku: "sku",
      //   name: "name",
      //   price: 100,
      //   quantity: 10
      // });
    })
    .fork(done, () => done())
  });
  it('Given ProductAdded, when CartClosed then Cart is closed in DB', done => {
    es.testProjector(UserCartsProjectors(params))
    .given([ //TODO: problema cuando es más de un evento?
      es.createCommittedEvent(CartEvents.UserCartCreated, {
        userId: "13ccec6f-d9cc-4082-bdde-4a8b195848d9"
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    ])
    .when(CartEvents.CartClosed, null
    , {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
    .map(() => {
      assert.equal(mockState.length, 1);
      assert.deepNestedInclude(mockState[0], {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 10,
        isClosed: true
      });
    })
    .fork(done, () => done())
  });
});
