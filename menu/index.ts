import * as MenuCommands from "src/domain/src/menu/menu.commands"

import { AppServiceParams } from "src/types";
import { MenuAggregate } from "./menu.aggregate"

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeAggregate(MenuAggregate(params), MenuCommands);
}
