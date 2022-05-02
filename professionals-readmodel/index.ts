import { AppServiceParams } from "src/types";
import { Professionals } from "./professionals.projectors"
import * as ProfessionalEvents from 'src/domain/src/professionals/professionals.events';

export function create(params: AppServiceParams) {
  const { serverComponents } = params;
  serverComponents.eventsourcing.routeProjector(Professionals(params), ProfessionalEvents);
  serverComponents.endpoint.registerEndpoint({
    method: 'GET',
    module: 'professionals',
    route: 'professionals/readmodel/:id',
    name: 'professionals readmodel',
    description: 'get professional profile',
    isHttp: true,
    action: ({body, query, params}) =>{
      console.log("query", query)
      console.log("params", params)
      return serverComponents.database.mongo
        .getCollection('professionals-projection')
        .read({...query, ...params})
    }
  })
}
