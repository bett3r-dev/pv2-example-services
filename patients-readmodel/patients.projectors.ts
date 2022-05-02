import * as patientEvents from "src/domain/src/patients/patients.events";

import {AppServiceParams} from "src/types";
import {CommittedEvent} from "@bett3r-dev/server-core";
import { Projector } from "@bett3r-dev/server-core";
import { PatientMenu, AnthropometricData, MedicalInformation, PatientModel, PersonalDetails } from 'src/domain/src/patients/patients.types';

//TODO: chequear el projectro

export const Patients = ({serverComponents, logger}: AppServiceParams): Projector<typeof patientEvents> => {
  const {eventsourcing: {eventBigIntToString}} = serverComponents;

  const upsertPatientProfile = (event: CommittedEvent<PatientModel>) =>
    serverComponents.database.mongo
      .getCollection('patients-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})

  const upsertPatientPersonalDetails = (event: CommittedEvent<PersonalDetails>) =>
    serverComponents.database.mongo
      .getCollection('patients-projection')
      .read({id: event.metadata.id})
      .map((patient:PatientModel) =>
      serverComponents.database.mongo
        .getCollection('patients-projection')
        .upsert({id: event.metadata.id}, {$set: {personalDetails: {...patient[0]?.personalDetails, ...event.data}, lastEvent: eventBigIntToString(event)}})//PROBLEM: reemplaza, no upsert
      )

  const upsertPatientMedicalInformation = (event: CommittedEvent<MedicalInformation>) =>
    serverComponents.database.mongo
      .getCollection('patients-projection')
      .read({id: event.metadata.id})
      .map((patient:PatientModel) =>
       serverComponents.database.mongo
        .getCollection('patients-projection')
        .upsert({id: event.metadata.id}, {$set: {medicalInformation: {...patient[0]?.medicalInformation, ...event.data}, lastEvent: eventBigIntToString(event)}})//PROBLEM: reemplaza, no upsert
     )

  const upsertPatientAnthropometricData = (event: CommittedEvent<AnthropometricData>) =>
    serverComponents.database.mongo
      .getCollection('patients-projection')
      .read({id: event.metadata.id})
      .map((patient:PatientModel) =>
       serverComponents.database.mongo
        .getCollection('patients-projection')
        .upsert({id: event.metadata.id}, {$set: {anthropometricData: {...patient[0]?.anthropometricData, ...event.data}, lastEvent: eventBigIntToString(event)}})//PROBLEM: reemplaza, no upsert
     )

  const upsertPatientAssignedMenu = (event: CommittedEvent<PatientMenu>) =>
    serverComponents.database.mongo
      .getCollection('patients-projection')
      .upsert({id: event.metadata.id}, {$addToSet: {assignedMenu: event.data}})

  return {
    name: "Patients",
    eventProjectors:{
      PatientProfileCreated: upsertPatientProfile,
      PatientPersonalDetailsUpserted: upsertPatientPersonalDetails,
      PatientMedicalInformationUpserted: upsertPatientMedicalInformation,
      PatientAnthropometricDataUpserted: upsertPatientAnthropometricData,
      MenuAssigned:(event: CommittedEvent<PatientMenu>) =>{
         return upsertPatientAssignedMenu(event)
        },
    }
  };

}

