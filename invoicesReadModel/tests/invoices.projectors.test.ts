import * as u from '@bett3r-dev/server-utils';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { AppServiceParams } from 'src/types';
import { InvoicesProjector } from '../invoices.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import { Async } from '@bett3r-dev/crocks';
import { InvoiceEvents } from 'src/domain/src/invoice';

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

describe( 'InvoiceProjector', function() {
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

  it.only('Given no previous events, when InvoiceCreated then Invoice is inserted in DB', done => {
    es.testProjector(InvoicesProjector(params))
      .when(InvoiceEvents.InvoiceCreated, {
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
      }, {id: "57f31970-3400-4583-88f7-4e8e7779c6f5"})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {
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
        });
      })
      .fork(done, () => done())
  });
  //TODO: como testear el read
  // it('Given InvoiceCreated, when read then Invoice is returned from DB', done => {
  //   es.testProjector(InvoicesProjector(params))
  //   .given([es.createCommittedEvent(InvoiceEvents.InvoiceCreated, {
  //     userId: "385c5970-9716-4093-8021-713c15729fff",
  //     products: {
  //       "171e36dd-6cef-468a-8d83-778301f6d554":{
  //         productId:"fb1b5b61-5eb2-48f3-88e6-10833b9d8a8a",
  //         productInfo: {
  //           sku: "sku",
  //           name: "product",
  //           price: 100
  //         },
  //         quantity: 1
  //       }
  //     },
  //     total: 1000,
  //     address: "address"
  //   }, {id: "57f31970-3400-4583-88f7-4e8e7779c6f5"})])
  //     .when()
  //     .map(() => {
  //       assert.equal(mockState.length, 1);
  //       assert.deepNestedInclude(mockState[0], {
  //         userId: "385c5970-9716-4093-8021-713c15729fff",
  //         products: {
  //           "171e36dd-6cef-468a-8d83-778301f6d554":{
  //             productId:"fb1b5b61-5eb2-48f3-88e6-10833b9d8a8a",
  //             productInfo: {
  //               sku: "sku",
  //               name: "product",
  //               price: 100
  //             },
  //             quantity: 1
  //           }
  //         },
  //         total: 1000,
  //         address: "address"
  //       });
  //     })
  //     .fork(done, () => done())
  // });



});
