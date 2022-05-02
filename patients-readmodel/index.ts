import { AppServiceParams } from "src/types";
import { Patients } from "./patients.projectors"
import * as PatientEvents from 'src/domain/src/patients/patients.events';

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeProjector(Patients(params), PatientEvents);
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'patients',
    route: 'patients/readmodel/:id',
    name: 'patients readmodel',
    description: 'get patient profile',
    isHttp: true,
    action: ({body, query, params}) =>{
      console.log("query", query)
      console.log("params", params)
      return serverComponents.database.mongo
        .getCollection('patients-projection')
        .read({...query, ...params})
    }
})
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'patients',
    route: 'patients/readmodel',
    name: 'patients readmodel',
    description: 'get all patients',
    isHttp: true,
    action: ({body, query, params}) =>{
      console.log("query", query)
      console.log("params", params)
      return serverComponents.database.mongo
        .getCollection('patients-projection')
        .read({...query, ...params})
    }
})
}
