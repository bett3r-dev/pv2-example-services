import { Aggregate, AggregateState, createError } from "@bett3r-dev/server-core";
import { isTruthy, isFalsy } from '@bett3r-dev/crocks';
import Async from "@bett3r-dev/crocks/Async";
import maybeToAsync from '@bett3r-dev/crocks/Async/maybeToAsync';
import safe from "@bett3r-dev/crocks/Maybe/safe";
import * as PatientsEvents from "src/domain/src/patients/patients.events";
import { PatientModel } from "src/domain/src/patients/patients.types";
import { AppServiceParams } from "src/types";
import * as PatientsCommands from "src/domain/src/patients/patients.commands";
import { PatientsErrors } from "src/domain/src/patients";

//TODO: incompleto

export const PatientsAggregate = ({serverComponents}: AppServiceParams) : Aggregate<PatientModel, typeof PatientsCommands, typeof PatientsEvents> => {
  const {eventsourcing: {createEvent}, endpoint } = serverComponents;
  return ({
    name: "Patients",

    eventReducers: {
      PatientProfileCreated: (state, data) => ({...data, menuList:[]}), //acá el id meterlo?
      PatientPersonalDetailsUpserted: (state, data) => ({...state,  personalDetails: {...state.personalDetails, ...data}}),
      PatientMedicalInformationUpserted:(state, data) => ({...state, medicalInformation: {...state.medicalInformation,...data}}),
      PatientAnthropometricDataUpserted: (state,data) => ({...state, anthropometricData: {...state.anthropometricData,...data}}),
      MenuAssigned: (state,data) => ({...state, menuList: [...state.menuList , data]}),
    },
    commandHandlers:{
      CreatePatientProfile: ({state}: AggregateState<PatientModel>, data) =>{
        return Async.of({
          events:[createEvent(PatientsEvents.PatientProfileCreated, data)]
        })
      },
      UpsertPatientPersonalDetails: ({state}: AggregateState<PatientModel>, data) => {
        if (!state) return Async.Rejected(createError(PatientsErrors.PatientNotCreated, null));
        return Async.of({
          events:[createEvent(PatientsEvents.PatientPersonalDetailsUpserted, data)]
        })
      },
      UpsertPatientMedicalInformation: ({state}: AggregateState<PatientModel>, data) => {
        if (!state) return Async.Rejected(createError(PatientsErrors.PatientNotCreated, null));
        return Async.of({
          events:[createEvent(PatientsEvents.PatientMedicalInformationUpserted, data)]
        })
      },
      UpsertPatientAnthropometricData: ({state}: AggregateState<PatientModel>, data) => {
        if (!state) return Async.Rejected(createError(PatientsErrors.PatientNotCreated, null));
        return Async.of({
          events:[createEvent(PatientsEvents.PatientAnthropometricDataUpserted, data)]
        })
      },
      AssignMenu: ({state}: AggregateState<PatientModel>, data, params) => { //params -> {req -> cosas, }
        if (!state) return Async.Rejected(createError(PatientsErrors.PatientNotCreated, null));
        const getDateMonthsFromNow = (months) => {
          const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()
          const now = new Date()
          const date = new Date()
          date.setDate(1)
          date.setMonth(date.getMonth() + months)
          date.setDate(Math.min(now.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth()+1)))
          return date;
        }
        return Async.of((resCitas)=>(resMenu) => {console.log('citas', resCitas, 'resMenu', resMenu)
          return safe(isFalsy, !resCitas.length && !resMenu.length)})
        .ap(endpoint.call('events/readmodel/patient/:patientId', {
          params: {patientId: params.params.id},
          query:{professionalId: data.professionalId, createdAt:{ $gte: new Date(getDateMonthsFromNow(-6)), $lt: new Date(getDateMonthsFromNow(6)) }} }))
        .ap(endpoint.call('menus/readmodel/:id', { params: {id: data.menuId}}))
        .chain(maybeToAsync(undefined))
        .bimap(
          ()=> createError(PatientsErrors.PatientNotActive, null),
          () => ({events:[createEvent(PatientsEvents.MenuAssigned, data)]}),
        )
      },
    },
  })
};

