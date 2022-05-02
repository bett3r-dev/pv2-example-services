import * as AppointmentCommands from "src/domain/src/appointments/appointments.commands"
import * as AppointmentEvents from 'src/domain/src/appointments/appointments.events';

import { AppServiceParams } from "src/types";
import { AppointmentsAggregate } from "./appointments.aggregate"
import { AppointmentReservation } from "./appointmentReservation.policy"

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeAggregate(AppointmentsAggregate(params), AppointmentCommands);
  serverComponents.eventsourcing.routePolicy(AppointmentReservation(params), AppointmentEvents)
}
