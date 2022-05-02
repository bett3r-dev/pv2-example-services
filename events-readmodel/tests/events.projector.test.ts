import * as u from '@bett3r-dev/server-utils';
import * as AppointmentEvents from 'src/domain/appointment/appointment.events';
import { createTestEnvironment, EventSourcingTest } from "src/serverComponents/eventsourcing/src/testing";
import { AppServiceParams } from 'src/types';
import { Events } from '../events.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import Async from '@bett3r-dev/crocks/Async';

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

describe( 'EventProjector', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);
  const appointment = (dateStart?: Date, dateEnd?: Date, statusParam?: 'pending'|'scheduled'|'canceled'|'timedout') => {
    return {
      professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      patientId: '280ebd03-954a-42ea-839d-4f071931974b',
      dateTimeStart: dateStart,
      dateTimeEnd: dateEnd,
      status: statusParam,
      payment: {
          externalPaymentId: '1234',
          paymentMethod: 'MercadoPago',
          price: 100
      }
    }
  }

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

  it('Given no previous events, when Payment Started then event is inserted in DB', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .when(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...appointment(dateStart, dateEnd, 'pending'), type: 'appointment'});
      })
      .fork(done, () => done())
  });

  it('Given Payment Started, when PaymentApproved then event payment status is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([es.createCommittedEvent(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id})])
      .when(AppointmentEvents.PaymentApproved, {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'approved'}}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 2);
        assert.deepNestedInclude(mockState[0], {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'approved'}});
      })
      .fork(done, () => done())
  });

  it('Given Payment Started, when PaymentRejected then event payment status is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([es.createCommittedEvent(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id})])
      .when(AppointmentEvents.PaymentRejected, {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'rejected'}}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 2);
        assert.deepNestedInclude(mockState[0], {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'rejected'}});
      })
      .fork(done, () => done())
  });

  it('Given Payment Started and PaymentApproved, when AppointmentScheduled then event status is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([
        es.createCommittedEvent(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id}),
        es.createCommittedEvent(AppointmentEvents.PaymentApproved, {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'approved'}}, {id})
      ])
      .when(AppointmentEvents.AppointmentScheduled, {...appointment(dateStart, dateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 3);
        assert.deepNestedInclude(mockState[0], {...appointment(dateStart, dateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}});
      })
      .fork(done, () => done())
  });

  it('Given Payment Started, PaymentApproved and AppointmentScheduled, when AppointmentCanceled then event status is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([
        es.createCommittedEvent(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id}),
        es.createCommittedEvent(AppointmentEvents.PaymentApproved, {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'approved'}}, {id}),
        es.createCommittedEvent(AppointmentEvents.AppointmentScheduled, {...appointment(dateStart, dateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}}, {id})
      ])
      .when(AppointmentEvents.AppointmentCanceled, {...appointment(dateStart, dateEnd, 'canceled'), payment: {...appointment().payment, status:'approved'}}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 4);
        assert.deepNestedInclude(mockState[0], {...appointment(dateStart, dateEnd, 'canceled'), payment: {...appointment().payment, status:'approved'}});
      })
      .fork(done, () => done())
  });
  it('Given Payment Started, when AppointmentTimedout then event status is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([es.createCommittedEvent(AppointmentEvents.PaymentStarted, appointment(dateStart, dateEnd, 'pending'), {id})])
      .when(AppointmentEvents.AppointmentTimedout, appointment(dateStart, dateEnd, 'timedout'), {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 2);
        assert.deepNestedInclude(mockState[0], appointment(dateStart, dateEnd, 'timedout'));
      })
      .fork(done, () => done())
  });
  it('Given Payment Started, PaymentApproved and AppointmentScheduled, when AppointmentRescheduled then event datetime is upserted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const diffDateStart = new Date("2021-11-11T23:28:56.782Z");
    const diffDateEnd = new Date(diffDateStart.getHours() + 1);
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Events(params))
      .given([
        es.createCommittedEvent(AppointmentEvents.PaymentStarted,  appointment(dateStart, dateEnd, 'pending'), {id}),
        es.createCommittedEvent(AppointmentEvents.PaymentApproved, {...appointment(dateStart, dateEnd, 'pending'), payment: {...appointment().payment, status:'approved'}}, {id}),
        es.createCommittedEvent(AppointmentEvents.AppointmentScheduled, {...appointment(dateStart, dateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}}, {id})
      ])
      .when(AppointmentEvents.AppointmentRescheduled, {...appointment(diffDateStart,diffDateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.equal(mongo.upsert.callCount, 4);
        assert.deepNestedInclude(mockState[0], {...appointment(diffDateStart,diffDateEnd, 'scheduled'), payment: {...appointment().payment, status:'approved'}});
      })
      .fork(done, () => done())
  });

});
