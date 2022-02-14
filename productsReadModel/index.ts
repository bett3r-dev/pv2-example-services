import { ProductEvents } from '@bett3r-dev/pv2-example-domain';
import { AppServiceParams } from 'src/types';
import { ProductsProjectors } from "./products.projectors";

export function create(params: AppServiceParams) {
  const {serverComponents: {eventsourcing, endpoint, database:{mongo}}, u} = params;
  eventsourcing.routeProjector(ProductsProjectors(params), ProductEvents);
  endpoint.registerEndpoint({
    method: 'GET',
    module: 'ProductsReadModel',
    route: '/products/readmodel/:id',
    name: 'products readmodel',
    description: 'get product',
    isPublic: true,
    action: ({body, query, params}) => {
      return mongo
        .getCollection('products')
        .read({...query, ...params})
    }
})
  endpoint.registerEndpoint({
    method: 'GET',
    module: 'ProductsReadModel',
    route: '/products/readmodel',
    name: 'products readmodel',
    description: 'get all products',
    isPublic: true,
    isHttp: true,
    action: ({body, query, params}) =>{
      return mongo
        .getCollection('products')
        .read({...query, ...params})
    }
})
}
