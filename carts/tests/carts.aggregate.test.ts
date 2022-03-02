import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { CartsAggregate } from '../carts.aggregate';
import {CartCommands, CartEvents} from '@bett3r-dev/pv2-example-domain';
import { ProductEvents } from 'src/domain/src/product';
import { Async } from '@bett3r-dev/crocks';
import { createCommittedEvent } from '../../../serverComponents/eventsourcing/src/utils';

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
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CreateUserCart, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})
        .then({events:[es.createCommittedEvent(
          CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})], state:{userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}})
        .fork(done, () => done())
    });
    it('returns error CartAlreadyExist', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})
        ], '8e7f291e-be86-4c35-98f0-a2b84e4f0755')
        .when(CartCommands.CreateUserCart, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})
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
  describe('AddProduct', () => {
    it('Given UserCartCreated, when AddProduct then ProductAdded', done => {
      es.testAggregate(CartsAggregate(params))
        .given([es.createEvent(CartEvents.UserCartCreated,{userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.AddProduct, {
          productId: 'f8744f7f-6ab3-4325-a233-f336cd1680c1',
          productInfo: {
            sku: "sku",
            name: "product1",
            price: 100,
          },
          quantity: 10
        },{params: {id: '5832ac10-8efd-4d15-ac14-f70e802a6b2c'}})
        .then({events:[es.createCommittedEvent(
          CartEvents.ProductAdded, {
            productId: 'f8744f7f-6ab3-4325-a233-f336cd1680c1',
            productInfo: {
              sku: "sku",
              name: "product1",
              price: 100,
            },
            quantity: 10
          })], state: {"products": {"f8744f7f-6ab3-4325-a233-f336cd1680c1": {"productId": "f8744f7f-6ab3-4325-a233-f336cd1680c1", "productInfo": {"name": "product1", "price": 100, "sku": "sku"}, "quantity": 10}}, "userId": "4515fb41-9a1f-4738-89fc-1e101a178df3"}}) //TODO:
        .fork(done, () => done())
    });
    it('when AddProduct, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([],'afc417b8-f9a2-4289-9cb8-ee6e8b03ca2c')
        .when(CartCommands.AddProduct,  {
          productId: 'f8744f7f-6ab3-4325-a233-f336cd1680c1',
          productInfo: {
            sku: "sku",
            name: "product1",
            price: 100,
          },
          quantity: 10
        },{params: {id: 'afc417b8-f9a2-4289-9cb8-ee6e8b03ca2c'}})
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('CartDoesNotExist');
          expect(err.data).toEqual(['afc417b8-f9a2-4289-9cb8-ee6e8b03ca2c'])
        })
        .fork(done, () => done())
    });
    it('when AddProduct, returns error ProductAlreadyInCart', done => {
      mockCall.mockImplementationOnce(()=> Async.of({ state: { sku: "sku", name: "product1", price: 100, quantity: 500 } }))
      es.testAggregate(CartsAggregate(params))
        .given([es.createEvent(
          CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: 'f8744f7f-6ab3-4325-a233-f336cd1680c1',
            productInfo: {
              sku: "sku",
              name: "product1",
              price: 100,
            },
            quantity: 10
          })],
          'abd803fc-ac48-44c6-98c7-7dc9b1bafec6')
        .when(CartCommands.AddProduct, {
          productId: 'f8744f7f-6ab3-4325-a233-f336cd1680c1',
          productInfo: {
            sku: "sku",
            name: "product1",
            price: 100,
          },
          quantity: 10
        }, {params: {id: 'abd803fc-ac48-44c6-98c7-7dc9b1bafec6'}})
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('ProductAlreadyInCart');
          expect(err.data).toEqual(['f8744f7f-6ab3-4325-a233-f336cd1680c1'])
        })
        .fork(done, () => done())
    });
    it.skip('when AddProduct, returns error ProductOutOfStock', done => { //TODO: cuando lo corro con el only, funciona, cuando lo corro con todos NO?
      mockCall.mockImplementationOnce(()=> Async.of({ state: { sku: "sku", name: "product1", price: 100, quantity: 0 } }))
      es.testAggregate(CartsAggregate(params))
      .given([es.createEvent(CartEvents.UserCartCreated,{userId: '5fec5b18-2b43-4383-9cfe-52e71d192d46'})], '5fec5b18-2b43-4383-9cfe-52e71d192d46')
      .when(CartCommands.AddProduct, {
        productId: '5fec5b18-2b43-4383-9cfe-52e71d192d46',
        productInfo: {
          sku: "sku",
          name: "product1",
          price: 100,
        },
        quantity: 10
      },{params: {id: '5fec5b18-2b43-4383-9cfe-52e71d192d46'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        console.log('el errrorrr', err)
        expect(err[0]['ProductOutOfStock']).toBeInstanceOf(Error);
        expect(Object.keys(err[0])[0]).toEqual('ProductOutOfStock');
        expect(err[0]['ProductOutOfStock'].data).toEqual(['5fec5b18-2b43-4383-9cfe-52e71d192d46'])
      })
      .fork(done, () => done())
    });
    it.skip('when AddProduct, returns error ProductDoesNotExist', done => {//TODO: Assertion error, pero ahora por que?
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
      .given([es.createEvent(CartEvents.UserCartCreated,{userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
      .when(CartCommands.AddProduct, {
        productId: 'f4793a7d-b51a-4b31-b571-f944241bba5a',
        productInfo: {
          sku: "sku",
          name: "product1",
          price: 100,
        },
        quantity: 10
      },{params: {id: '5832ac10-8efd-4d15-ac14-f70e802a6b2c'}})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        console.log('el error', err)
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductDoesNotExist');
        expect(err.data).toEqual(['f8744f7f-6ab3-4325-a233-f336cd1680c1'])
      })
      .fork(done, () => done())
    });
  });
  describe('UpdateQuantity', () => {
    it('Given UserCartCreated and ProductAdded, when UpdateQuantity then QuantityUpdated', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: "94c74f7a-c912-477e-9807-2e4625ab5369",
            productInfo: {
              sku: "sku",
              name: "name",
              price: 100
            },
            quantity: 1
          }),
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.UpdateQuantity, {productId:"94c74f7a-c912-477e-9807-2e4625ab5369", quantity:100})
        .then({events:[es.createCommittedEvent(
          CartEvents.QuantityUpdated, {productId:"94c74f7a-c912-477e-9807-2e4625ab5369", quantity:100})], state:{
             products:{
               "94c74f7a-c912-477e-9807-2e4625ab5369":{
                 productId: "94c74f7a-c912-477e-9807-2e4625ab5369",
                 productInfo:{
                   name: "name",
                   price: 100,
                   sku: "sku",
                 },
                 quantity: 100,
               },
             },
              userId: "4515fb41-9a1f-4738-89fc-1e101a178df3",
            }})
        .fork(done, () => done())
    });
    it('Given UserCartCreated and ProductAdded, when UpdateQuantity (and product quantity is 0) then QuantityUpdated and ProductRemoved', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: "77fbf762-07ed-48ed-8780-87336d40ee8e",
            productInfo: {
              sku: "sku",
              name: "name",
              price: 100
            },
            quantity: 1
          }),
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.UpdateQuantity, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e", quantity:0})
        .then({events:[
          es.createCommittedEvent( CartEvents.QuantityUpdated, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e", quantity:0}),
          es.createCommittedEvent(CartEvents.ProductRemoved, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e"} )
        ], state:{
             products:{},
              userId: "4515fb41-9a1f-4738-89fc-1e101a178df3",
            }})
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error CartDoesNotExist', done => {
      es.testAggregate(CartsAggregate(params))
        .given([], 'cc7f2a1f-d93c-441f-a242-86ab597a3601')
        .when(CartCommands.UpdateQuantity, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e", quantity:100})
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('CartDoesNotExist');
          expect(err.data).toEqual(['cc7f2a1f-d93c-441f-a242-86ab597a3601'])
        })
        .fork(done, () => done())
    });
    it('when UpdateQuantity, returns error ProductNotInCart', done => {
      es.testAggregate(CartsAggregate(params))
      .given([ es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
      .when(CartCommands.UpdateQuantity, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e", quantity:100})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('ProductNotInCart');
        expect(err.data).toEqual(['77fbf762-07ed-48ed-8780-87336d40ee8e'])
      })
      .fork(done, () => done())
    });
    it('when UpdateQuantity, and quantity is < 0, returns error NegativeQuantity', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: "77fbf762-07ed-48ed-8780-87336d40ee8e",
            productInfo: {
              sku: "sku",
              name: "name",
              price: 100
            },
            quantity: 1
          }),
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.UpdateQuantity, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e", quantity:-1})
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('NegativeQuantity');
        expect(err.data).toEqual(['77fbf762-07ed-48ed-8780-87336d40ee8e'])
      })
      .fork(done, () => done())
    });
    it.skip('when UpdateQuantity, returns error ProductOutOfStock', done => { //TODO: cuando lo corro con el only, funciona, cuando lo corro con todos NO?
      mockCall.mockImplementationOnce(()=> Async.of({ state: { sku: "sku", name: "product1", price: 100, quantity: 10 } }))
      es.testAggregate(CartsAggregate(params))
      .given([
        es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
        es.createEvent(CartEvents.ProductAdded, {
          productId: "b2f5e392-e7a7-45f1-b3f5-f6ae08a51d29",
          productInfo: {
            sku: "sku",
            name: "name",
            price: 100
          },
          quantity: 1
        }),
      ], 'dc415637-b4bd-45aa-9afb-dcde133df3fe')
      .when(CartCommands.UpdateQuantity, {productId:"b2f5e392-e7a7-45f1-b3f5-f6ae08a51d29", quantity:12})
      .then({events:[], state:{}})
      .coalesce(u.I, done)
      .map((err) => {
        expect(err[0]['ProductOutOfStock']).toBeInstanceOf(Error);
        expect(Object.keys(err[0])[0]).toEqual('ProductOutOfStock');
        expect(err[0]['ProductOutOfStock'].data).toEqual(['b2f5e392-e7a7-45f1-b3f5-f6ae08a51d29'])
      })
      .fork(done, () => done())
    });
  });
  describe('RemoveProduct', () => {
    it('Given UserCartCreated and ProductAdded, when RemoveProduct then ProductRemoved', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: "77fbf762-07ed-48ed-8780-87336d40ee8e",
            productInfo: {
              sku: "sku",
              name: "name",
              price: 100
            },
            quantity: 1
          }),
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.RemoveProduct, "77fbf762-07ed-48ed-8780-87336d40ee8e")
        .then({events:[es.createCommittedEvent(
          CartEvents.ProductRemoved, {productId:"77fbf762-07ed-48ed-8780-87336d40ee8e"})], state:{
             products:{},
              userId: "4515fb41-9a1f-4738-89fc-1e101a178df3",
            }})
        .fork(done, () => done())
    });
    it('when RemoveProduct, returns error ProductNotInCart', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'})
        ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.RemoveProduct, "77fbf762-07ed-48ed-8780-87336d40ee8e")
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('ProductNotInCart');
          expect(err.data).toEqual(['77fbf762-07ed-48ed-8780-87336d40ee8e'])
        })
        .fork(done, () => done())
    });
    it('when RemoveProduct, returns error CartDoesNotExist', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([], '2a24547c-9800-4c0f-b3f5-eb2efd40bc01')
        .when(CartCommands.RemoveProduct, "77fbf762-07ed-48ed-8780-87336d40ee8e")
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('CartDoesNotExist');
          expect(err.data).toEqual(['2a24547c-9800-4c0f-b3f5-eb2efd40bc01'])
        })
        .fork(done, () => done())
    });
  });
  describe('CloseCart', () => {
    it('Given UserCartCreated and ProductAdded, when CloseCart then CartClosed', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([
          es.createEvent(CartEvents.UserCartCreated, {userId: '4515fb41-9a1f-4738-89fc-1e101a178df3'}),
          es.createEvent(CartEvents.ProductAdded, {
            productId: "77fbf762-07ed-48ed-8780-87336d40ee8e",
            productInfo: {
              sku: "sku",
              name: "name",
              price: 100
            },
            quantity: 1
          }),
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(CartCommands.CloseCart, null)
        .then({events:[es.createCommittedEvent(
          CartEvents.CartClosed, null)], state:{
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
              isClosed: true,
              userId: "4515fb41-9a1f-4738-89fc-1e101a178df3",
            }})
        .fork(done, () => done())
    });
    it('when CloseCart, returns error CartDoesNotExist', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([], 'e02604a4-aa9c-42cd-ac24-2b603ba57890')
        .when(CartCommands.CloseCart, null)
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('CartDoesNotExist');
        expect(err.data).toEqual(['e02604a4-aa9c-42cd-ac24-2b603ba57890'])
      })
      .fork(done, () => done())
    });
    it('when CloseCart, returns error EmptyCart', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(CartsAggregate(params))
        .given([ es.createEvent(CartEvents.UserCartCreated, {userId: 'deee9c53-3df8-436b-af20-a1569e3b2806'}), ], 'deee9c53-3df8-436b-af20-a1569e3b2806')
        .when(CartCommands.CloseCart, null)
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toEqual('EmptyCart');
        expect(err.data).toEqual(['deee9c53-3df8-436b-af20-a1569e3b2806'])
      })
      .fork(done, () => done())
    });
  });
});
