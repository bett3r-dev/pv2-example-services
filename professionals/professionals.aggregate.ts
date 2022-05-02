import * as ProfessionalsCommands from "src/domain/src/professionals/professionals.commands";
import * as ProfessionalsEvents from "src/domain/src/professionals/professionals.events";

import { Aggregate, AggregateState, createError } from "@bett3r-dev/server-core";

import { AppServiceParams } from "src/types";
import Async from "@bett3r-dev/crocks/Async";
import { ProfessionalsErrors, ProfessionalModel } from "src/domain/src/professionals/index";

export const ProfessionalsAggregate = ({serverComponents, configStream}: AppServiceParams) : Aggregate<ProfessionalModel, typeof ProfessionalsCommands, typeof ProfessionalsEvents> => {
  const {eventsourcing: {createEvent}} = serverComponents;
  return ({
    name: "Professionals",
    eventReducers: {
      ProfessionalProfileCreated: (state, data) => ({...data, validationStatus: 'pending'}),
      ProfessionalProfileApproved: (state, data) => ({...state, validationStatus: 'approved'}),
      ProfessionalProfileRejected: (state, data) => ({...state, validationStatus: 'rejected'}),
      ProfessionalPersonalDetailsUpserted: (state, data) => ({...state, personalDetails: {...state.personalDetails, ...data}}),
      ProfessionalProfessionalDetailsUpserted:(state, data) => ({...state, professionalDetails: {...state.professionalDetails,...data}}),
    },
    commandHandlers:{
      CreateProfessionalProfile: ({state}: AggregateState<ProfessionalModel>, data) =>{
        //TODO: Que exista el email en el registro(que se haya registrado el email previamente?)
        //TODO: que es extrictamente necesario que llegue en esta instancia?
        if (state) return Async.Rejected(createError(ProfessionalsErrors.ProfessionalAlreadyCreated, null));
        return Async.of({
          events:[createEvent(ProfessionalsEvents.ProfessionalProfileCreated, data)]
        })
      },
      ApproveProfessionalProfile: ({state}: AggregateState<ProfessionalModel>, data) =>{
        if (!state) return Async.Rejected(createError(ProfessionalsErrors.ProfessionalNotCreated, null));
        return Async.of({
          events:[createEvent(ProfessionalsEvents.ProfessionalProfileApproved, data)]
        })
      },
      RejectProfessionalProfile: ({state}: AggregateState<ProfessionalModel>, data) =>{
        if (!state) return Async.Rejected(createError(ProfessionalsErrors.ProfessionalNotCreated, null));
        return Async.of({
          events:[createEvent(ProfessionalsEvents.ProfessionalProfileRejected, data)]
        })
      },
      UpsertProfessionalPersonalDetails: ({state}: AggregateState<ProfessionalModel>, data) => {
        if (!state) return Async.Rejected(createError(ProfessionalsErrors.ProfessionalNotCreated, null));
        return Async.of({
          events:[createEvent(ProfessionalsEvents.ProfessionalPersonalDetailsUpserted, data)]
        })
      },
      UpsertProfessionalProfessionalDetails: ({state}: AggregateState<ProfessionalModel>, data) => {
        if (!state) return Async.Rejected(createError(ProfessionalsErrors.ProfessionalNotCreated, null));
        return Async.of({
          events:[createEvent(ProfessionalsEvents.ProfessionalProfessionalDetailsUpserted, data)]
        })
      },
    },
  })
};
