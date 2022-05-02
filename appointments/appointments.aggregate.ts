import * as AppointmentCommands from "src/domain/src/appointments/appointments.commands";
import * as AppointmentEvents from "src/domain/src/appointments/appointments.events";

import { Aggregate, AggregateState, createError } from "@bett3r-dev/server-core";

import { AppServiceParams } from "src/types";
import Async from "@bett3r-dev/crocks/Async";
import { isTruthy, isFalsy } from '@bett3r-dev/crocks';
import maybeToAsync from '@bett3r-dev/crocks/Async/maybeToAsync';
import safe from '@bett3r-dev/crocks/Maybe/safe';
import { AppointmentsErrors, AppointmentModel  } from "src/domain/src/appointments";

export const AppointmentsAggregate = ({serverComponents, configStream}: AppServiceParams) : Aggregate<AppointmentModel, typeof AppointmentCommands, typeof AppointmentEvents> => {
  const {eventsourcing: {createEvent},  endpoint} = serverComponents;
  return ({
    name: "Appointments",
    eventReducers: {
      PaymentStarted: (state, data) => ({...data, status: 'pending'}),
      PaymentApproved: (state, data) => ({...state, payment:{...state.payment, status: 'approved'}}),
      PaymentRejected:(state, data) => ({...state, payment:{...state.payment, status: 'rejected'}}),
      AppointmentTimedout: (state,data) => ({...state, status: 'timedout'}),
      AppointmentScheduled: (state,data) => ({...state, status: 'scheduled'}),
      AppointmentCanceled: (state,data) => ({...state, status: 'canceled'}),
      AppointmentRescheduled: (state,data) => ({...state, ...data}),
    },
    commandHandlers:{
      StartPayment: ({state}: AggregateState<AppointmentModel>, data: Omit<AppointmentModel, 'status'>) =>{
        if(state) return Async.Rejected(createError(AppointmentsErrors.PaymentAlreadyStarted, null))
        return endpoint.call('events/readmodel/availability', { body: {...data}})
        .map((res)=> safe(isFalsy, !res) )
        .chain(maybeToAsync(undefined))
        .bimap(
          ()=> createError(AppointmentsErrors.ScheduleNotAvailable, null),
          () => ({events:[createEvent(AppointmentEvents.PaymentStarted, data)]}),
        )
      },
      ApprovePayment: ({state}: AggregateState<AppointmentModel>, data) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        if (state.status && state.status !== 'pending') return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        return Async.of({
          events:[createEvent(AppointmentEvents.PaymentApproved, null)]
        })
      },
      RejectPayment: ({state}: AggregateState<AppointmentModel>, data) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        if (state.status && state.status !== 'pending') return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        return Async.of({
          events:[createEvent(AppointmentEvents.PaymentRejected, null)]
        })
      },
      ScheduleAppointment: ({state}: AggregateState<AppointmentModel>, data) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        if (state.status && state.status !== 'pending') return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        if (state.payment && state.payment.status !== 'approved') return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        return Async.of({
          events:[createEvent(AppointmentEvents.AppointmentScheduled, null)]
        })
      },
      TimeoutAppointment: (state, data) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        return Async.of({
          events:[createEvent(AppointmentEvents.AppointmentTimedout, null)]
        })
      },
      CancelAppointment: ({state}: AggregateState<AppointmentModel>, data) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        if (state.status && state.status !== 'scheduled') return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        return Async.of({
          events:[createEvent(AppointmentEvents.AppointmentCanceled, null)]
        })
      },
      RescheduleAppointment: ({state}: AggregateState<AppointmentModel>, data: Pick<AppointmentModel, 'dateTimeStart' | 'dateTimeEnd'>) => {
        if (!state) return Async.Rejected(createError(AppointmentsErrors.AppointmentNotReady, null));
        // if (state.status && state.status !== 'scheduled') return Async.Rejected(Errors.BadRequestError(['2']));
        return endpoint.call('events/readmodel/availability', { body: {professionalId: state.professionalId, patientId: state.patientId, dateTimeStart:data.dateTimeStart, dateTimeEnd: data.dateTimeEnd}})
        .map((res)=> safe(isFalsy, !res))
        .chain(maybeToAsync(undefined))
        .bimap(
          ()=> createError(AppointmentsErrors.ScheduleNotAvailable, null),
          () => ({events:[createEvent(AppointmentEvents.AppointmentRescheduled, data)]}),
        )
      },
    },
  })
};
