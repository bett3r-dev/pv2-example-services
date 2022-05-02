import * as events from "src/domain/src/professionals/professionals.events";

import {AppServiceParams} from "src/types";
import {CommittedEvent} from "@bett3r-dev/server-core";
import { Projector } from "@bett3r-dev/server-core";
import {PersonalDetails, ProfessionalDetails, ProfessionalModel} from "src/domain/src/professionals/professionals.types";
//TODO: chequear comentario upsertProfessionalPersonalDetails
export const Professionals = ({serverComponents, logger}: AppServiceParams): Projector<typeof events> => {
  const {eventsourcing: {eventBigIntToString}} = serverComponents;

  const upsertProfessionalProfile = (event: CommittedEvent<ProfessionalModel>) =>
    serverComponents.database.mongo
      .getCollection('professionals-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})

  const upsertProfessionalPersonalDetails = (event: CommittedEvent<PersonalDetails>) =>
    serverComponents.database.mongo
      .getCollection('professionals-projection')
      .read({id: event.metadata.id})
      .map((professional:ProfessionalModel) =>
        serverComponents.database.mongo
          .getCollection('professionals-projection')
          .upsert({id: event.metadata.id}, {$set: {personalDetails: {...professional?.personalDetails, ...event.data}, lastEvent: eventBigIntToString(event)}})
        )//Revisar Mongo merge? YY por que estoy leyendo y despues cambiando?


  const upsertProfessionalProfessionalDetails = (event: CommittedEvent<ProfessionalDetails>) =>
      serverComponents.database.mongo
        .getCollection('professionals-projection')
        .upsert({id: event.metadata.id}, {$set: {professionalDetails: {...event.data}, lastEvent: eventBigIntToString(event)}})


  return {
    name: "Professionals",
    eventProjectors:{
      ProfessionalProfileCreated: upsertProfessionalProfile,
      ProfessionalPersonalDetailsUpserted: upsertProfessionalPersonalDetails,
      ProfessionalProfessionalDetailsUpserted: upsertProfessionalProfessionalDetails,
    }
  };

}

