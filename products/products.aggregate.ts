import { Async, constant, isNil } from '@bett3r-dev/crocks';
import { ProductCommands, ProductErrors, ProductEvents, ProductModel } from '@bett3r-dev/pv2-example-domain';
import { Aggregate, createError, UserAuthentication } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

type User = UserAuthentication & {
  products: string[]
}

export const ProductsAggregate = ({serverComponents, u}: AppServiceParams) : Aggregate<ProductModel, typeof ProductCommands, typeof ProductEvents> => {
  const {eventsourcing: {createEvent}} = serverComponents;
  return ({
    name: 'Products',
    eventReducers: {
      ProductCreated: (state, data) => ({...state, ...data}),
      StockUpdated: (state, data) => ({...state, quantity: data}),
      ProductDeleted: () => null,
      StockDecreased: (state, data) => ({...state, quantity: state.quantity - data}),
      StockRestored: (state, data) => ({...state, quantity: state.quantity + data}),
    },
    commandHandlers: {
      CreateProduct: ({state}, data, {params, context: {req}}) =>
        Async.of(state)
          .chain(u.safeAsync(isNil))
          .bimap(
            constant(createError(ProductErrors.ProductAlreadyExists, [params.id])),
            constant({events:[createEvent(ProductEvents.ProductCreated, {...data, image: Object.values(req.filePaths || {})[0]})]}),
          ),

      UpdateStock: (state, data, {params, context:{user}}) =>
        u.cond([
          [()=> !state, constant(Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id])))],
          [()=> data < 0, constant(Async.Rejected(createError(ProductErrors.NegativeQuantity, [params.id])))],
          [u.T, constant(Async.of({events:[createEvent(ProductEvents.StockUpdated, data)]}))]
        ])(),

      DeleteProduct: (state, _, {params}) =>
        !!state
          ? Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id]))
          : Async.of({events:[createEvent(ProductEvents.ProductDeleted, null)]}),

      DecreaseStock: (state, data, {params}) => {
        Object.keys(data).map((id: string) => {
          if (!state[id]) return Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [id]))
          if (state[id].state.quantity - data[id].quantity < 0) Async.Rejected(createError(ProductErrors.NegativeQuantity, [id]))
          return Async.of([createEvent(ProductEvents.StockDecreased, data[id].quantity)]);     
        });
        return Async.of([]);
      },

      RestoreStock: (state, data,{params}) => {
        if (!state) return Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id]))
        return Async.of({events:[createEvent(ProductEvents.StockRestored, data.quantity)]})
      },
      
    }
  })
}
