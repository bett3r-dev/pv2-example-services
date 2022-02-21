import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { ProductsAggregate } from '../products.aggregate';
import {ProductCommands, ProductEvents} from '@bett3r-dev/pv2-example-domain';

describe('ProductsAggregate', () => {
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
  describe('CreateProduct', () => {
    it('Given no previous events, when CreateProduct then ProductCreated', done => {
      es.testAggregate(ProductsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(ProductCommands.CreateProduct,
        {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        })
        .then({events:[es.createCommittedEvent(
          ProductEvents.ProductCreated, {
            sku: "sku",
            name: "name",
            price: 100,
            quantity: 100
          })], state:{
            sku: "sku",
            name: "name",
            price: 100,
            quantity: 100
          }})
        .fork(done, () => done())
    });
    it('returns error ProductAlreadyExists', done => {
      es.testAggregate(ProductsAggregate(params))
        .given([
          es.createEvent(ProductEvents.ProductCreated,{
            sku: "sku",
            name: "name",
            price: 100,
            quantity: 100
          })
        ], '8e7f291e-be86-4c35-98f0-a2b84e4f0755')
        .when(ProductCommands.CreateProduct, {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        })
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('ProductAlreadyExists');
          expect(err.data).toEqual(['8e7f291e-be86-4c35-98f0-a2b84e4f0755'])
        })
        .fork(done, () => done())
    });
  });
  describe('UpdateStock', () => {
    it('Given ProductCreated, when UpdateStock then StockUpdated', done => {
      es.testAggregate(ProductsAggregate(params))
        .given([
          es.createEvent(ProductEvents.ProductCreated,{
            sku: "sku",
            name: "name",
            price: 100,
            quantity: 100
          })
        ], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
        .when(ProductCommands.UpdateStock, 120)
        .then({events:[es.createCommittedEvent(
          ProductEvents.StockUpdated, 120)], state:{
            sku: "sku",
            name: "name",
            price: 100,
            quantity: 120
          }})
        .fork(done, () => done())
    });
    it('when UpdateStock, returns error ProductDoesNotExist', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([], 'f44fd6eb-03a9-4412-8eab-3be766056b1e')
      .when(ProductCommands.UpdateStock, 100)
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductDoesNotExist');
        expect(err.data).toEqual(['f44fd6eb-03a9-4412-8eab-3be766056b1e'])
      })
      .fork(done, () => done())
    });

    it('when UpdateStock, returns error NegativeQuantity', done => {
     es.testAggregate(ProductsAggregate(params))
     .given([
      es.createEvent(ProductEvents.ProductCreated,{
        sku: "sku",
        name: "name",
        price: 100,
        quantity: 100
      })
    ], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
    .when(ProductCommands.UpdateStock, -1)
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('NegativeQuantity');
        expect(err.data).toEqual(['1e8cee29-dfe7-48a2-b612-3de7a3977b33'])
      })
      .fork(done, () => done())
    });
  });
  describe('DeleteProduct', () => {
    it('Given ProductCreated, when DeleteProduct then ProductDeleted', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([
        es.createEvent(ProductEvents.ProductCreated,{
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        })
      ], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
      .when(ProductCommands.DeleteProduct, null, {params: {id: '1e8cee29-dfe7-48a2-b612-3de7a3977b33'}})
      .then({events:[es.createCommittedEvent(
        ProductEvents.ProductDeleted, null)], state: null})
      .fork(done, () => done())
    });
    it('when DeleteProduct, returns error ProductDoesNotExist', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
      .when(ProductCommands.DeleteProduct, null, {params: {id: '1e8cee29-dfe7-48a2-b612-3de7a3977b33'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductDoesNotExist');
        expect(err.data).toEqual(['1e8cee29-dfe7-48a2-b612-3de7a3977b33'])
      })
      .fork(done, () => done())
    });
  });
  describe('DecreaseStock', () => {
    it('Given ProductCreated, when DecreaseStock then StockDecreased', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([
        es.createEvent(ProductEvents.ProductCreated,{
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        })
      ], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
      .when(ProductCommands.DecreaseStock, {cartId:'1e8cee29-dfe7-48a2-b612-3de7a3977b33', quantity:10}, {params: {id: '1e8cee29-dfe7-48a2-b612-3de7a3977b33'}})
      .then({events:[es.createCommittedEvent(
        ProductEvents.StockDecreased, 10)], state: {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 90
        }})
      .fork(done, () => done())
    });
    it('when DecreaseStock, returns error NegativeQuantity', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([
        es.createEvent(ProductEvents.ProductCreated,{
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 9
        })
      ], '1e8cee29-dfe7-48a2-b612-3de7a3977b33')
      .when(ProductCommands.DecreaseStock, {cartId:'1e8cee29-dfe7-48a2-b612-3de7a3977b33', quantity:10}, {params: {id: '1e8cee29-dfe7-48a2-b612-3de7a3977b33'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('NegativeQuantity');
        expect(err.data).toEqual(['1e8cee29-dfe7-48a2-b612-3de7a3977b33'])
      })
      .fork(done, () => done())
    });
    it('when RemoveProduct, returns error ProductDoesNotExist', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([], '3e148424-01f5-4aba-b633-eb95f1e7902b')
      .when(ProductCommands.DecreaseStock, {cartId:'3e148424-01f5-4aba-b633-eb95f1e7902b', quantity:10}, {params: {id: '3e148424-01f5-4aba-b633-eb95f1e7902b'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        console.log('err', err)
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductDoesNotExist');
        expect(err.data).toEqual(['3e148424-01f5-4aba-b633-eb95f1e7902b'])
      })
      .fork(done, () => done())
    });
  });
  describe('RestoreStock', () => {
    it('Given ProductCreated, when RestoreStock then StockRestored', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([
        es.createEvent(ProductEvents.ProductCreated,{
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 100
        })
      ], '88ad0f52-351e-4dfa-b6d3-6762afa7305d')
      .when(ProductCommands.RestoreStock, {cartId:'88ad0f52-351e-4dfa-b6d3-6762afa7305d', quantity:10}, {params: {id: '88ad0f52-351e-4dfa-b6d3-6762afa7305d'}})
      .then({events:[es.createCommittedEvent(
        ProductEvents.StockRestored, 10)], state: {
          sku: "sku",
          name: "name",
          price: 100,
          quantity: 110
        }})
      .fork(done, () => done())
    });
    it('when RestoreStock, returns error ProductDoesNotExist', done => {
      es.testAggregate(ProductsAggregate(params))
      .given([], '3e148424-01f5-4aba-b633-eb95f1e7902b')
      .when(ProductCommands.RestoreStock, {cartId:'3e148424-01f5-4aba-b633-eb95f1e7902b', quantity:10}, {params: {id: '3e148424-01f5-4aba-b633-eb95f1e7902b'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        console.log('err', err)
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductDoesNotExist');
        expect(err.data).toEqual(['3e148424-01f5-4aba-b633-eb95f1e7902b'])
      })
      .fork(done, () => done())
    });
  });
});
