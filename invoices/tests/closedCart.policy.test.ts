import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { Async } from '@bett3r-dev/crocks';
import sinon from 'sinon';
import { assert } from 'chai';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { ClosedCartPolicy } from '../closedCart.policy';
import { InvoicesAggregate } from '../invoices.aggregate';
import {CartEvents, InvoiceCommands, InvoiceEvents} from '@bett3r-dev/pv2-example-domain';
import { CartClosed } from '../../../domain/src/cart/cart.events';

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

describe( 'ClosedCartPolicy', function() {
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
      },
    };
  })

  afterEach(() => {
    sinon.resetHistory();
    mockState.splice(0);
  })

  //TODO: no me funciona
  it.only('Given no previous events, when CartClosed then CreateInvoice command', done => {
    mockCall.mockImplementationOnce((route, params)=> {
      if(route === '/carts/:id') return Async.of({
      state: {
        products: {
          "f4ee3e88-fb19-43d5-866d-447a57ef8e0f": {
            productId: "f4ee3e88-fb19-43d5-866d-447a57ef8e0f",
            productInfo: {
              sku: "THE SKU TAL",
              name: "Some Product",
              price: 1234
            },
            quantity: 1
          }
        }
      }})
      if(route === '/users/:id') return Async.of(
        {
          _id: "61d4425ab71c147bd3a5a4ca",
          id: "15fa71e9-786c-4a23-8ff1-2e862b96a4fb",
          address: "address",
          lastName: "lastName",
          mail: "mail",
          name: "name"
        }
      )
   })

    es.testPolicy(ClosedCartPolicy(params))
      .when(CartClosed, null)
      .then([es.createCommand(InvoiceCommands.CreateInvoice, null)])
      .fork(done, () => done())
  });


});
