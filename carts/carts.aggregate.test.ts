import { testing } from '@bett3r-dev/server-eventsourcing';
import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { CartsAggregate } from './carts.aggregate';
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
});