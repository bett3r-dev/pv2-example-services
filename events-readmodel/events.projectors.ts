   import * as AppointmentEvents from "src/domain/src/appointments/appointments.events";
import * as ProfessionalScheduleEvents from 'src/domain/src/professionalSchedules/professionalSchedules.events';
import * as ProfessionalBlockedTimeLapseEvents from 'src/domain/src/professionalBlockedTimeLapses/professionalBlockedTimeLapses.events';

import {AppServiceParams} from "src/types";
import {CommittedEvent} from "@bett3r-dev/server-core";
import { Projector } from "@bett3r-dev/server-core";
import { AppointmentModel } from "src/domain/src/appointments/appointments.types";
import { ProfessionalScheduleModel } from 'src/domain/src/professionalSchedules/professionalSchedules.types';

//TODO: chequear si esto sigue siendo así como está acá
export const Events = ({serverComponents, logger}: AppServiceParams): Projector<typeof AppointmentEvents & typeof ProfessionalScheduleEvents & typeof ProfessionalBlockedTimeLapseEvents> => {
  const {eventsourcing: {eventBigIntToString}} = serverComponents;

  const upsertAppointmentStatus = (status: string) => (event: CommittedEvent<AppointmentModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, type: 'appointment', status: status, lastEvent: eventBigIntToString(event)}})

  const upsertAppointment = (event: CommittedEvent<AppointmentModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})


  const upsertAppointmentPayment = (status: string) => (event: CommittedEvent<AppointmentModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, 'payment.status': status, lastEvent: eventBigIntToString(event)}})

  const upsertSchedule = (event: CommittedEvent<ProfessionalScheduleModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, type: "schedule", lastEvent: eventBigIntToString(event)}})
  const upsertBlockedTimelapse = (event: CommittedEvent<ProfessionalScheduleModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})
  const removeBlockedTimelapse = (event: CommittedEvent<ProfessionalScheduleModel>) =>
    serverComponents.database.mongo
      .getCollection('events-projection')
      .destroy({id: event.metadata.id});

  return {
    name: "Events",
    eventProjectors:{
      PaymentStarted: upsertAppointmentStatus('pending'),
      PaymentApproved: upsertAppointmentPayment('approved'),
      PaymentRejected: upsertAppointmentPayment('rejected'),
      AppointmentScheduled: upsertAppointmentStatus('scheduled'),
      AppointmentCanceled: upsertAppointmentStatus('canceled'),
      AppointmentTimedout: upsertAppointmentStatus('timedout'),
      AppointmentRescheduled: upsertAppointment,
      ScheduleUpserted: upsertSchedule,
      TimelapseBlocked: upsertBlockedTimelapse,
      TimelapseUnblocked: removeBlockedTimelapse
    }
  };

}

