import { Async, constant, isNil } from '@bett3r-dev/crocks';
import { ProductCommands, ProductErrors, ProductEvents, ProductModel } from '@bett3r-dev/pv2-example-domain';
import { Aggregate, createError } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const ProductsAggregate = ({serverComponents, u}: AppServiceParams) : Aggregate<ProductModel, typeof ProductCommands, typeof ProductEvents> => {
  const {eventsourcing: {createEvent}} = serverComponents;
  return ({
    name: 'Products',
    eventReducers: {
      ProductCreated: (state, data) => ({...state, ...data}),
      StockUpdated: (state, data) => ({...state, quantity: data}),
      ProductDeleted: () => (null),
      StockDecreased: (state, data) => ({...state, quantity: state.quantity - data}),
      StockRestored: (state, data) => ({...state, quantity: state.quantity + data}),
    },
    commandHandlers: {
      CreateProduct: ({state}, data, {params}) =>
        Async.of(state)
          .chain(u.safeAsync(isNil))
          .bimap(
            constant(createError(ProductErrors.ProductAlreadyExists, [params.id])),
            constant({events:[createEvent(ProductEvents.ProductCreated, data)]}),
          ),

      UpdateStock: ({state}, data, {params}) =>{
        return u.cond([
          [()=> !state, constant(Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id])))],
          [()=> data < 0, constant(Async.Rejected(createError(ProductErrors.NegativeQuantity, [params.id])))],
          [u.T, constant(Async.of({events:[createEvent(ProductEvents.StockUpdated, data)]}))]
        ])()},
      DeleteProduct: ({state}, _, {params}) =>
        !state
          ? Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id]))
          : Async.of({events:[createEvent(ProductEvents.ProductDeleted, null)]}),
      DecreaseStock: (state, data,{params}) => {
        if (!state || !state?.state) return Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id]))
        if ( data.quantity < 1) return Async.Rejected(createError(ProductErrors.NegativeQuantity, [params.id]))
        if (state.state.quantity - data.quantity < 0) return Async.Rejected(createError(ProductErrors.NegativeQuantity, [params.id]))
        return Async.of({events:[createEvent(ProductEvents.StockDecreased, data.quantity)]})
      },
      RestoreStock: (state, data,{params}) => {
        if (!state || !state?.state) return Async.Rejected(createError(ProductErrors.ProductDoesNotExist, [params.id]))
        return Async.of({events:[createEvent(ProductEvents.StockRestored, data.quantity)]})
      },
    }
  })
}
