import * as PatientsCommands from "src/domain/src/patients/patients.commands"

import { AppServiceParams } from "src/types";
import { PatientsAggregate } from "./patients.aggregate"

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeAggregate(PatientsAggregate(params), PatientsCommands);
}
