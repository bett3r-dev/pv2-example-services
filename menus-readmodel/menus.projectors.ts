import * as MenuEvents from "src/domain/src/menu/menu.events";

import {AppServiceParams} from "src/types";
import {CommittedEvent} from "@bett3r-dev/server-core";
import { Projector } from "@bett3r-dev/server-core";
import {MenuModel} from "src/domain/src/menu/menu.types";

//TODO: chequear este projector

export const Menus = ({serverComponents, logger}: AppServiceParams): Projector<typeof MenuEvents> => {
  const {eventsourcing: {eventBigIntToString}} = serverComponents;

  const upsertMenu = (event: CommittedEvent<MenuModel>) =>
    serverComponents.database.mongo
      .getCollection('menus-projection')
      .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})

  // const assignMenu = (event: CommittedEvent<MenuModel>) =>
  //     serverComponents.database.mongo
  //       .getCollection('menus-projection')
  //       .upsert({id: event.metadata.id}, {$set: {...event.data, lastEvent: eventBigIntToString(event)}})
  //       // .upsert({id: event.metadata.id}, {$set: {patients:{...event.data}, lastEvent: eventBigIntToString(event)}})


  return {
    name: "Menus",
    eventProjectors:{
      MenuCreated: upsertMenu,
      MenuUpdated: upsertMenu,
    }
  };

}

