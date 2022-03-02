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
    it('Given no previous events, when CreateInvoice then InvoiceCreated', done => {
      es.testAggregate(InvoicesAggregate(params))
        .given([])
        .when(InvoiceCommands.CreateInvoice, {
          userId: "385c5970-9716-4093-8021-713c15729fff",
          products: {
            "171e36dd-6cef-468a-8d83-778301f6d554":{
              productId:"fb1b5b61-5eb2-48f3-88e6-10833b9d8a8a",
              productInfo: {
                sku: "sku",
                name: "product",
                price: 100
              },
              quantity: 1
            }
          },
          total: 1000,
          address: "address"
        })
        .then({events:[es.createCommittedEvent(
          InvoiceEvents.InvoiceCreated, {
            userId: "385c5970-9716-4093-8021-713c15729fff",
            products: {
              "171e36dd-6cef-468a-8d83-778301f6d554":{
                productId:"fb1b5b61-5eb2-48f3-88e6-10833b9d8a8a",
                productInfo: {
                  sku: "sku",
                  name: "product",
                  price: 100
                },
                quantity: 1
              }
            },
            total: 1000,
            address: "address"
          })], state:{
            userId: "385c5970-9716-4093-8021-713c15729fff",
            products: {
              "171e36dd-6cef-468a-8d83-778301f6d554":{
                productId:"fb1b5b61-5eb2-48f3-88e6-10833b9d8a8a",
                productInfo: {
                  sku: "sku",
                  name: "product",
                  price: 100
                },
                quantity: 1
              }
            },
            total: 1000,
            address: "address"
          }})
        .fork(done, () => done())
    });

  });
});
