import * as MenuCommands from "src/domain/src/menu/menu.commands";
import * as MenuEvents from "src/domain/src/menu/menu.events";

import { Aggregate, AggregateState, createError } from "@bett3r-dev/server-core";

import { AppServiceParams } from "src/types";
import Async from "@bett3r-dev/crocks/Async";
import safe from '@bett3r-dev/crocks/Maybe/safe';
import { isFalsy, isTruthy } from '@bett3r-dev/crocks';
import maybeToAsync from "@bett3r-dev/crocks/Async/maybeToAsync";
import { MenuErrors, MenuModel } from "src/domain/src/menu";
//TODO: revisar si está todo
export const MenuAggregate = ({serverComponents, configStream}: AppServiceParams) : Aggregate<MenuModel, typeof MenuCommands, typeof MenuEvents> => {
  const {eventsourcing: {createEvent}, endpoint} = serverComponents;
  return ({
    name: "Menu",
    eventReducers: {
      MenuCreated: (state, data) => ({...data}),
      MenuUpdated: (state, data) => ({...state, ...data}),
    },
    commandHandlers:{
      CreateMenu: ({state}: AggregateState<MenuModel>, data) =>{
        return endpoint.call('professionals/readmodel/:id', { params: {id: data.professionalId}})
        .map((res: any)=> safe(isFalsy, !res.length) ) //TODO: type
        .chain(maybeToAsync(undefined))
        .bimap(
          ()=> createError(MenuErrors.ProfessionalNotFound, null),
          () => ({events:[createEvent(MenuEvents.MenuCreated, data)]}),
        )
      },
      UpdateMenu: ({state}: AggregateState<MenuModel>, data) => {
        if (!state) return Async.Rejected(createError(MenuErrors.MenuNotFound, null));
        return Async.of({
          events:[createEvent(MenuEvents.MenuUpdated, data)]
        })
      }
    },
  })
};
