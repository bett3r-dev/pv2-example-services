import { CommittedEvent, Policy } from "@bett3r-dev/server-core";
import { AppServiceParams } from 'src/types';
import * as AppointmentEvents from 'src/domain/src/appointments/appointments.events';
import { AppointmentModel } from 'src/domain/src/appointments/appointments.types';
import Async from "@bett3r-dev/crocks/Async";
import { constant, isDefined, isTruthy } from '@bett3r-dev/crocks';
import { ScheduleAppointment } from 'src/domain/src/appointments/appointments.commands';
import { AppointmentsAggregate } from './appointments.aggregate';

export const AppointmentReservation = (params): Policy<Pick<typeof AppointmentEvents, 'PaymentApproved'>> => {
  const {serverComponents, u} = params;
  const {eventsourcing: {createCommand}} = serverComponents;


  return ({
    name: "AppointmentReservation",
    commandHandler: AppointmentsAggregate(params),
    eventHandlers:{
      PaymentApproved: (event: CommittedEvent<AppointmentModel>) => {
        return Async.of()
          .map(constant({
            id: event.metadata.id,
            command: createCommand(ScheduleAppointment, null)
          }))
      },
  }
  })
}
