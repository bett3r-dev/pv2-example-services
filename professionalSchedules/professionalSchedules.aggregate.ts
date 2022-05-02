import * as ProfessionalScheduleCommands from "src/domain/src/professionalSchedules/professionalSchedules.commands";
import * as ProfessionalScheduleEvents from "src/domain/src/professionalSchedules/professionalSchedules.events";

import { Aggregate, AggregateState, createError } from "@bett3r-dev/server-core";

import { AppServiceParams } from "src/types";
import Async from "@bett3r-dev/crocks/Async";
import { ProfessionalScheduleModel } from "src/domain/src/professionalSchedules/professionalSchedules.types";

//TODO: validaciones

export const ProfessionalSchedulesAggregate = ({serverComponents, configStream}: AppServiceParams) : Aggregate<ProfessionalScheduleModel, typeof ProfessionalScheduleCommands, typeof ProfessionalScheduleEvents> => {
  const {eventsourcing: {createEvent}} = serverComponents;
  return ({
    name: "ProfessionalSchedules",

    eventReducers: {
      ScheduleUpserted: (state, data) => ({type: "schedule", ...data}), //TODO: cambiar en tests
    },
    commandHandlers:{
      UpsertSchedule: (state, data) =>{
        return Async.of({
          events:[createEvent(ProfessionalScheduleEvents.ScheduleUpserted, data)]
        })
      },
    },
  })
};
