import * as u from 'src/app-utils';
import { AppServiceParams } from 'src/types';
import { Async } from '@bett3r-dev/crocks';
import sinon from 'sinon';
import { assert } from 'chai';
import { testing } from '@bett3r-dev/server-eventsourcing';
import { PurchaseApprovedPolicy } from '../purchaseApproved.policy';
import { CartsAggregate } from '../carts.aggregate';
import {CartCommands, CartEvents} from '@bett3r-dev/pv2-example-domain';

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

describe( 'AppointmentReservation.policy', function() {
  const { createTestEnvironment } = testing
  let es: testing.EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);


  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
      u,
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
  //TODO: para abajo
  // it('Given no previous events, when PaymentApproved then CloseCart', done => {
  //   const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
  //   es.testPolicy(AppointmentReservation(params))
  //     .when(Events.PaymentStarted, {
  //       professionalId: 'dd6349f9-4409-41b1-9999-acfbf71cc179',
  //       patientId: 'dd6349f9-4409-41b1-9999-acfbf71cc173',
  //       dateTimeStart: new Date('2021-11-11T23:28:56.782Z'),
  //       status: 'pending',
  //     }, {id})
  //     .then([])
  //     // .map(() => {
  //     //   assert.isTrue(mongo.read.calledOnceWith({patientId: id}));
  //     //   assert.deepEqual(mockState, [{wellcomeSent: true, patientId: id}]);
  //     // })
  //     .fork(done, () => done())
  // });


});
