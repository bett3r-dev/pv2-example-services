import * as u from '@bett3r-dev/server-utils';
import * as Events from 'src/domain/src/appointments/appointments.events';
import * as Commands  from "src/domain/src/appointments/appointments.commands";
import {createTestEnvironment,EventSourcingTest} from "src/serverComponents/eventsourcing/src/testing";
import {AppServiceParams} from 'src/types';
import {AppointmentsAggregate} from '../appointments.aggregate';

describe( 'appointments.aggregate', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {u, serverComponents: {eventsourcing: es}};
  })

  const event = (dateTimeStart: Date, dateTimeEnd: Date) => {
    return {
      professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      patientId: '280ebd03-954a-42ea-839d-4f071931974b',
      dateTimeStart: dateTimeStart,
      dateTimeEnd: dateTimeEnd,
      payment: {
          externalPaymentId: '1234',
          paymentMethod: 'MercadoPago',
          price: 100
      }
    }
  }


  it('Given no previous events, when StartPayment then PaymentStarted', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.StartPayment,
        event(dateStart, dateEnd)
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.PaymentStarted,
            event(dateStart, dateEnd)
          )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'pending'
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted, when ApprovePayment then PaymentApproved', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd))
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.ApprovePayment,  null)
      .then({
        events: [
          es.createCommittedEvent( Events.PaymentApproved, null )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'pending',
          payment: {...event(dateStart, dateEnd).payment, status:'approved'}
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted, when RejectPayment then PaymentRejected', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd))
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.RejectPayment, null )
      .then({
        events: [
          es.createCommittedEvent( Events.PaymentRejected, null )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'pending',
          payment: {...event(dateStart, dateEnd).payment, status:'rejected'}
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted and Payment Approved, when ScheduleAppointment then AppointmentScheduled', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd)),
        es.createEvent(Events.PaymentApproved, { ...event(dateStart, dateEnd), status: 'pending' })
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.ScheduleAppointment, null )
      .then({
        events: [
          es.createCommittedEvent( Events.AppointmentScheduled, null )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'scheduled',
          payment: {...event(dateStart, dateEnd).payment, status:'approved'}
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted, when TimeoutAppointment then AppointmentTimedout', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd))
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.TimeoutAppointment, null )
      .then({
        events: [
          es.createCommittedEvent( Events.AppointmentTimedout, null )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'timedout'
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted, Payment Approved and AppointmentScheduled, when CancelAppointment then EventCanceled', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd)),
        es.createEvent(Events.PaymentApproved, { ...event(dateStart, dateEnd), status: 'pending' }),
        es.createEvent(Events.AppointmentScheduled, { ...event(dateStart, dateEnd), payment: {...event(dateStart, dateEnd).payment, status:'approved'}})
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.CancelAppointment, null )
      .then({
        events: [
          es.createCommittedEvent( Events.AppointmentCanceled, null )
        ],
        state: {
          ...event(dateStart, dateEnd),
          status: 'canceled',
          payment: {...event(dateStart, dateEnd).payment, status:'approved'}
        }
      })
      .fork(done, () => done());
  });

  it('Given PaymentStarted, Payment Approved and AppointmentScheduled, when RescheduleAppointment then EventRescheduled', done => {
    const dateStart = new Date();
    const dateEnd = new Date(dateStart.getHours() + 1);
    const differentDateStart = new Date("2021-11-11T23:28:56.782Z");
    const differentDateEnd = new Date(differentDateStart.getHours() + 1);
    es.testAggregate(AppointmentsAggregate(params))
      .given([
        es.createEvent(Events.PaymentStarted, event(dateStart, dateEnd)),
        es.createEvent(Events.PaymentApproved, { ...event(dateStart, dateEnd), status: 'pending' }),
        es.createEvent(Events.AppointmentScheduled, { ...event(dateStart, dateEnd), payment: {...event(dateStart, dateEnd).payment, status:'approved'}})
      ], '280ebd03-954a-42ea-839d-4f071931974b')
      .when(Commands.RescheduleAppointment,
        {
          dateTimeStart: differentDateStart,
          dateTimeEnd: differentDateEnd
        }
      )
      .then({
        events: [
          es.createCommittedEvent(
            Events.AppointmentRescheduled,
            {
              dateTimeStart: differentDateStart,
              dateTimeEnd: differentDateEnd
            }
          )
        ],
        state: {
          ...event(differentDateStart, differentDateEnd),
          status: 'scheduled',
          payment: {...event(dateStart, dateEnd).payment, status:'approved'}
        }
      })
      .fork(done, () => done());
  });


});
