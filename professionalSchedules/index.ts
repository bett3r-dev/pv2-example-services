import * as ProfessionalSchedulesCommands from "src/domain/src/professionalSchedules/professionalSchedules.commands"

import { AppServiceParams } from "src/types";
import { ProfessionalSchedulesAggregate } from "./professionalSchedules.aggregate"

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeAggregate(ProfessionalSchedulesAggregate(params), ProfessionalSchedulesCommands);
}
