import * as u from '@bett3r-dev/server-utils';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { AppServiceParams } from 'src/types';
import { ProductsProjectors } from '../products.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import { Async } from '@bett3r-dev/crocks';
import { ProductEvents } from 'src/domain/src/product';

const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set?: T, $addToSet?: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, {...data.$set, ...data.$addToSet, ...filter});
    return Async.of();
  }),
  destroy: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state.splice(index, 1);
    return Async.of();
  })
})

describe( 'ProductProjector', function() {
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

  it('Given no previous events, when ProductCreated then Product is inserted in DB', done => {
    es.testProjector(ProductsProjectors(params))
      .when(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"b36a9ef7-5f9c-4f04-bcd0-2a6c97acca32"})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        });
      })
      .fork(done, () => done())
  });
  it('Given ProductCreated, when ProductDeleted then Product is removed from DB', done => {
    es.testProjector(ProductsProjectors(params))
      .given([
        es.createCommittedEvent(ProductEvents.ProductCreated, {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        }, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"}),
      ])
      .when(ProductEvents.ProductDeleted, null, {id:"6ed258fe-4e88-4e8c-8e53-e11e8635ccec"})
      .map(() => {
        assert.equal(mockState.length, 0);
      })
      .fork(done, () => done())
  });
  it.skip('Given ProductCreated, when StockUpdated then Product stock is updated in DB', done => { //TODO: llega {} en vez de number (funciona en yarn start pero no en test)
    es.testProjector(ProductsProjectors(params))
    .given([
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"}),
    ])
    .when(ProductEvents.StockUpdated, 10, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"})
    .map(() => {
      assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 10
        });
    })
    .fork(done, () => done())
  });
  it.skip('Given ProductCreated, when StockDecreased then Product stock is decreased in DB', done => {//TODO:
    es.testProjector(ProductsProjectors(params))
    .given([
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      }, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"}),
    ])
    .when(ProductEvents.StockDecreased, 10, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"})
    .map(() => {
      assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 90
        });
    })
    .fork(done, () => done())
  });
  it.skip('Given ProductCreated, when StockRestored then Product stock is restored in DB', done => { //TODO:
    es.testProjector(ProductsProjectors(params))
    .given([
      es.createCommittedEvent(ProductEvents.ProductCreated, {
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 90
      }, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"}),
    ])
    .when(ProductEvents.StockRestored, 10, {id:"b6c13cb3-c8b5-4e6f-b7fb-472213e5ec33"})
    .map(() => {
      assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        });
    })
    .fork(done, () => done())
  });
});
