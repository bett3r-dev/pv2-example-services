import * as ProfessionalsCommands from "src/domain/src/professionals/professionals.commands"

import { AppServiceParams } from "src/types";
import { ProfessionalsAggregate } from "./professionals.aggregate"

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeAggregate(ProfessionalsAggregate(params), ProfessionalsCommands);
}
