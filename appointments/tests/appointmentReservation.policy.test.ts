import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/src/appointments/appointments.events';
import { createTestEnvironment, EventSourcingTest } from "src/serverComponents/eventsourcing/src/testing";
import { AppServiceParams } from 'src/types';
import * as Commands from "src/domain/src/appointments/appointments.commands";
import { AppointmentReservation } from '../appointmentReservation.policy';
import sinon from 'sinon';
import { assert } from 'chai';
import Async from '@bett3r-dev/crocks/Async';

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
  let es: EventSourcingTest;
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

  // it('Given no previous events, when PaymentStarted then no command is called', done => {
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

  it('Given PaymentStarted, when PaymentApproved then ScheduleAppointment', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testPolicy(AppointmentReservation(params))
      // .given([es.createCommittedEvent(Events.PaymentStarted,{
      //   professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      //   patientId: '280ebd03-954a-42ea-839d-4f071931974b',
      //   dateTimeStart: dateStart,
      //   dateTimeEnd: dateEnd,
      //   status: 'pending'
      // }, {id})])
      .when(Events.PaymentApproved,{
        professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
        patientId: '280ebd03-954a-42ea-839d-4f071931974b',
        dateTimeStart: dateStart,
        dateTimeEnd: dateEnd,
        status: 'pending',
        payment: {
            externalPaymentId: '1234',
            paymentMethod: 'MercadoPago',
            price: 100,
            status: 'approved'
        }
      }, {id})
      .then([es.createCommand(Commands.ScheduleAppointment, null)])
      .fork(done, () => done())
  });

  // it('Given PaymentStarted and PaymentApproved, when AppointmentCanceled then no command is called', done => {
  //   const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
  //   const dateStart = new Date();
  //   const dateEnd = new Date(dateStart.getHours() + 1);
  //   es.testPolicy(AppointmentReservation(params))
  //     .given([
  //       es.createCommittedEvent(Events.PaymentStarted,{
  //           professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
  //           patientId: '280ebd03-954a-42ea-839d-4f071931974b',
  //           dateTimeStart: dateStart,
  //           dateTimeEnd: dateEnd,
  //           status: 'pending'
  //       }, {id}),
  //       es.createCommittedEvent(Events.PaymentApproved,{
  //         professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
  //         patientId: '280ebd03-954a-42ea-839d-4f071931974b',
  //         dateTimeStart: dateStart,
  //         dateTimeEnd: dateEnd,
  //         status: 'pending',
  //         payment: {
  //             externalPaymentId: '1234',
  //             paymentMethod: 'MercadoPago',
  //             price: 100,
  //             status: 'approved'
  //         }
  //       }, {id})
  //   ])
  //     .when(Events.AppointmentCanceled, null)
  //     .then([])
  //     .fork(done, () => done())
  // });

  // it('Given PaymentStarted and PaymentApproved, when AppointmentRescheduled then no command is called', done => {
  //   const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
  //   const dateStart = new Date();
  //   const dateEnd = new Date(dateStart.getHours() + 1);
  //   es.testPolicy(AppointmentReservation(params))
  //     .given([
  //       es.createCommittedEvent(Events.PaymentStarted,{
  //           professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
  //           patientId: '280ebd03-954a-42ea-839d-4f071931974b',
  //           dateTimeStart: dateStart,
  //           dateTimeEnd: dateEnd,
  //           status: 'pending'
  //       }, {id}),
  //       es.createCommittedEvent(Events.PaymentApproved,{
  //         professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
  //         patientId: '280ebd03-954a-42ea-839d-4f071931974b',
  //         dateTimeStart: dateStart,
  //         dateTimeEnd: dateEnd,
  //         status: 'pending',
  //         payment: {
  //             externalPaymentId: '1234',
  //             paymentMethod: 'MercadoPago',
  //             price: 100,
  //             status: 'approved'
  //         }
  //       }, {id})
  //   ])
  //     .when(Events.AppointmentRescheduled, null)
  //     .then([])
  //     .fork(done, () => done())
  // });
  // it('Given PaymentStarted , when AppointmentTimedout then no command is called', done => {
  //   const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
  //   const dateStart = new Date();
  //   const dateEnd = new Date(dateStart.getHours() + 1);
  //   es.testPolicy(AppointmentReservation(params))
  //     .given([
  //       es.createCommittedEvent(Events.PaymentStarted,{
  //           professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
  //           patientId: '280ebd03-954a-42ea-839d-4f071931974b',
  //           dateTimeStart: dateStart,
  //           dateTimeEnd: dateEnd,
  //           status: 'pending'
  //       }, {id})
  //     ])
  //     .when(Events.AppointmentTimedout, null)
  //     .then([])
  //     .fork(done, () => done())
  // });
});
