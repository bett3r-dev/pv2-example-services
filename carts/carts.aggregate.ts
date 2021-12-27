import { Async, constant, ifElse, isDefined, isEmpty, isNil } from '@bett3r-dev/crocks';
import { CartCommands, CartErrors, CartEvents, CartModel, CartProduct, ProductModel, ProductsReadModel } from '@bett3r-dev/pv2-example-domain';
import { Aggregate, AggregateState, CommandHandlerResponse, createError } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const CartsAggregate = ({serverComponents, u}: AppServiceParams) : Aggregate<CartModel, typeof CartCommands, typeof CartEvents> => {
  const {eventsourcing: {createEvent}, endpoint:{call}} = serverComponents;

  type ValidateFunction = (stock: ProductsReadModel[]) => (p:CartProduct) => boolean;

  type ValidationMapType = Record<keyof Pick<typeof CartErrors, 'ProductDoesNotExist' | 'ProductOutOfStock'>, ValidateFunction>

  const ErrorValidationMap: ValidationMapType = {
    ProductDoesNotExist: (stock: ProductsReadModel[]) => (p:CartProduct) =>
      !stock.find(h=> h.id === p.productId),
    ProductOutOfStock: (stock: ProductsReadModel[]) => (cartProduct:CartProduct) =>
      !!stock.find(p=> p.id === cartProduct.productId && p.quantity < cartProduct.quantity)
  }

  const validateProduct = (validationMap: Partial<ValidationMapType>, stock: ProductsReadModel[], errors: Record<string, string[]> = {}) =>
  u.cond(Object.values(u.map((errorValidationFunction, error) =>
    [errorValidationFunction(stock), u.pipe(u.prop('productId') , u.propPush(error, errors))]
  , validationMap)))

  const validateStockProducts = ( products: CartProduct[], validationMap: Partial<ValidationMapType>, errors: Record<string, string[]> = {} ) =>
  ( stock: ProductsReadModel[], ) => u.pipe(
    u.Transducers.seq(u.compose(
      u.Transducers.map(validateProduct(validationMap, stock, errors)),
      u.Transducers.filter(isDefined),
    )),
    ifElse( isEmpty,
      constant(Async.of(products)),
      u.pipe(
        u.map(u.map((errArray, error:string) => createError(CartErrors[error], errArray))),
        Object.values,
        Async.Rejected,
      )
    )
  )(products)

  const readAndValidateStockProducts = (validationMap: Partial<ValidationMapType>) => (data: CartProduct) =>
    call<AggregateState<ProductModel>>('/products/:id', {params:{id: data.productId}})
      .map(product => ({...product.state, id: product.lastEvent.metadata.id}))
      .map(u.ensureArray)
      .chain(validateStockProducts([data], validationMap));

  const validateProductInCart = (state: CartModel, productId: string) =>
    Async.of(state)
      .map(u.propPath(['products', productId]))
      .chain(u.safeAsync(isDefined))
      .bimap(constant(createError(CartErrors.ProductNotInCart, [productId])), u.I);

  return ({
    name: 'Carts',
    eventReducers: {
      UserCartCreated: () => ({}),
      ProductAdded: (state, data) => u.assocPath(['products', data.productId], data, state),
      QuantityUpdated: (state, data, metadata) => u.assocPath(['products', data.productId, 'quantity'], data.quantity, state),
      ProductRemoved: (state, data) => u.dissocPath(['products', data.productId], state),
      CartClosed: (state) => ({...state, isClosed: true}),
    },
    commandHandlers: {
      //TODO: Validate user exists
      CreateUserCart: (state, data, {params}) =>
        u.safeAsync(isEmpty, state)
          .bimap(
            constant(createError(CartErrors.CartAlreadyExist, [params.id])),
            constant({events:[createEvent(CartEvents.UserCartCreated, null)]})
          ),

      AddProduct: (state, data) =>
        u.safeAsync(isNil, u.propPath(['products', data.productId], state))
          .bimap(constant(createError(CartErrors.ProductAlreadyInCart, [data.productId])), u.I)
          .chain(() =>
            Async.of(data)
              .chain(readAndValidateStockProducts(ErrorValidationMap))
              .map(constant({events:[createEvent(CartEvents.ProductAdded, data)]}))
          ),

      UpdateQuantity: ({state}, data) =>
        validateProductInCart(state, data.productId)
          .map(constant(data))
          .chain(u.cond([
            [data => data.quantity < 0, constant(Async.Rejected(
              createError(CartErrors.NegativeQuantity, [data.productId])
            ))],
            [data => data.quantity === 0, constant(Async.of({
              events:[createEvent(CartEvents.QuantityUpdated, data), createEvent(CartEvents.ProductRemoved, u.pick(['productId'], data))]
            }))],
            [u.T, ()=>
              Async.of(data)
                .chain(readAndValidateStockProducts(u.pick(['ProductOutOfStock'], ErrorValidationMap)))
                .map(constant({events:[createEvent(CartEvents.QuantityUpdated, data)]} as CommandHandlerResponse))
            ]
          ])),

      RemoveProduct: ({state}, data) =>
        validateProductInCart(state, data)
          .map(constant({events:[createEvent(CartEvents.ProductRemoved, {productId: data})]})),


      CloseCart: () =>
        Async.of({events:[createEvent(CartEvents.CartClosed, null)]}),
    }
  })
}
