import { AppServiceParams } from "src/types";
import { Menus } from "./menus.projectors"
import * as MenuEvents from "src/domain/src/menu/menu.events";

//TODO: chequear endpoints

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeProjector(Menus(params), MenuEvents);
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'menus',
    route: 'menus/readmodel/:id',
    name: 'menus readmodel',
    description: 'get menu',
    isHttp: true,
    action: ({body, query, params}) =>{
      return serverComponents.database.mongo
        .getCollection('menus-projection')
        .read({...query, ...params})
    }
})
}
