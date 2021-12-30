import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { CartsAggregate } from '../carts.aggregate';
import {CartCommands, CartEvents} from '@bett3r-dev/pv2-example-domain';

describe('CartsAggregate', () => {
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

  describe('CreateUserCart', () => {

    it('Given no previous events, when CreateUserCart then UserCartCreated', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('returns error CartAlreadyExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, null)
        ], '8e7f291e-be86-4c35-98f0-a2b84e4f0755')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('CartAlreadyExist');
          expect(err.data).toEqual(['8e7f291e-be86-4c35-98f0-a2b84e4f0755'])
        })
        .fork(done, () => done())
    });
  });

    //TODO: para abajo
  describe('AddProduct', () => {
    //AddProduct
    it('Given UserCartCreated, when AddProduct then ProductAdded', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when AddProduct, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when AddProduct, returns error ProductAlreadyInCart', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when AddProduct, returns error ProductOutOfStock', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when AddProduct, returns error ProductDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
  });
  describe('UpdateQuantity', () => {
    it('Given UserCartCreated and ProductAdded, when UpdateQuantity then QuantityUpdated', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('Given UserCartCreated and ProductAdded, when UpdateQuantity (and product quantity is 0) then QuantityUpdated and ProductRemoved', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error ProductNotInCart', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error NegativeQuantity', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error ProductOutOfStock', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
  });
  describe('RemoveProduct', () => {
    it('Given UserCartCreated and ProductAdded, when RemoveProduct then ProductRemoved', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when RemoveProduct, returns error ProductNotInCart', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when RemoveProduct, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
  });
  describe('CloseCart', () => {
    it('Given UserCartCreated and ProductAdded, when CloseCart then CartClosed', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when CloseCart, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
    it('when CloseCart, returns error EmptyCart', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, null)], state:{}})
        .fork(done, () => done())
    });
  });
});
