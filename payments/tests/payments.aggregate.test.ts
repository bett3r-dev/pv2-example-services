import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { PaymentsAggregate } from '../payments.aggregate';
import {PaymentCommands, PaymentEvents} from '@bett3r-dev/pv2-example-domain';
import { Async } from '@bett3r-dev/crocks';
import { StartPayment } from '../../../domain/src/payment/payment.commands';

describe('PaymentsAggregate', () => {
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
  describe('StartPayment', () => {
    it('Given existing payment, when StartPayment then PaymentStarted', done => {
      mockCall.mockImplementationOnce(()=> Async.of({state: {
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
      }}))
      es.testAggregate(PaymentsAggregate(params))
      .given([
      ], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(PaymentCommands.StartPayment, null)
        .then({events:[es.createCommittedEvent(
          PaymentEvents.PaymentStarted, {
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
            amount: 100})], state:  {
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
            }})
        .fork(done, () => done())
    });
    it('when StartPayment, returns error CartDoesNotExist', done => {
      mockCall.mockImplementationOnce(()=> Async.of({}))
      es.testAggregate(PaymentsAggregate(params))
        .given([], '8e7f291e-be86-4c35-98f0-a2b84e4f0755')
        .when(PaymentCommands.StartPayment, null)
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('CartDoesNotExist');
          expect(err.data).toEqual(['8e7f291e-be86-4c35-98f0-a2b84e4f0755'])
        })
        .fork(done, () => done())
    });
    it('when StartPayment, returns error EmptyCart', done => {
      mockCall.mockImplementationOnce(()=> Async.of({state: {
        products:{}}}))
      es.testAggregate(PaymentsAggregate(params))
        .given([], '8e7f291e-be86-4c35-98f0-a2b84e4f0755')
        .when(PaymentCommands.StartPayment, null)
        .then({events:[], state:{}})
        .coalesce(u.I, done)
        .map((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.name).toEqual('EmptyCart');
        })
        .fork(done, () => done())
    });
  });

  describe('ApprovePayment', () => {
    it('Given PaymentStarted, when ApprovePayment then PaymentApproved', done => {
      mockCall.mockImplementationOnce(()=> Async.of({state: {
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
      }}))
      es.testAggregate(PaymentsAggregate(params))
        .given([es.createEvent(PaymentEvents.PaymentStarted, {
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
          amount: 100})], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(PaymentCommands.ApprovePayment, {cartId: '5832ac10-8efd-4d15-ac14-f70e802a6b2c'})
        .then({events:[es.createCommittedEvent(
          PaymentEvents.PaymentApproved, {cartId: '5832ac10-8efd-4d15-ac14-f70e802a6b2c'})], state:
          {
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
            amount: 100,
            status: 'approved'
          }})
        .fork(done, () => done())
    });

  });
  describe('RejectPayment', () => {
    it('Given PaymentStarted, when ApprovePayment then PaymentApproved', done => {
      mockCall.mockImplementationOnce(()=> Async.of({state: {
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
      }}))
      es.testAggregate(PaymentsAggregate(params))
        .given([es.createEvent(PaymentEvents.PaymentStarted, {
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
          amount: 100})], '5832ac10-8efd-4d15-ac14-f70e802a6b2c')
        .when(PaymentCommands.RejectPayment, {cartId: '5832ac10-8efd-4d15-ac14-f70e802a6b2c', reason: 'reason'})
        .then({events:[es.createCommittedEvent(
          PaymentEvents.PaymentRejected, {cartId: '5832ac10-8efd-4d15-ac14-f70e802a6b2c', reason: 'reason'})], state:
          {
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
            amount: 100,
            status: 'rejected'
          }})
        .fork(done, () => done())
    });

  });
});
