import { Async, constant, ifElse, isDefined, isEmpty, isNil } from '@bett3r-dev/crocks';
import { CartCommands, CartErrors, CartEvents, CartModel, CartProduct, ProductModel, ProductsReadModel, UserErrors } from '@bett3r-dev/pv2-example-domain';
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
    .map(product => ({...product.state, id: data.productId}))
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
      UserCartCreated: (_, data) => data,
      ProductAdded: (state, data) => u.assocPath(['products', data.productId], data, state),
      QuantityUpdated: (state, data) => u.assocPath(['products', data.productId, 'quantity'], data.quantity, state),
      ProductRemoved: (state, data) => u.dissocPath(['products', data.productId], state),
      CartClosed: (state) => ({...state, isClosed: true}),
    },
    commandHandlers: {
      CreateUserCart: (state, data, {params}) =>{
        if (!data.userId) return Async.Rejected(createError(UserErrors.UserDoesNotExist, null))
        return u.safeAsync(isEmpty, state)
          .bimap(constant(createError(CartErrors.CartAlreadyExist, [params.id])), u.I)
          .chain(() =>
            call('/users/:id', { params: {id: data.userId}})
            .chain(u.safeAsync(isDefined))
            .bimap(
              constant(createError(UserErrors.UserDoesNotExist, null)),
              () => ({events:[createEvent(CartEvents.UserCartCreated, {userId: data.userId})]}),
            )
          )
      },
          //Swap -> lo que esta en la izquiera lo pasa pa la derecha y viceversa (espera funciones de mapeos)
          //coalesce -> todo lo pasa para la derecha ( para la derecha funciona como un map, y para la izquierda como un swap)
      AddProduct: (state, data, {params}) =>{
        if(!state.state) return Async.Rejected(createError(CartErrors.CartDoesNotExist, [params.id]))
        return u.safeAsync(isNil, u.propPath(['products', data.productId], state.state))
          .bimap(constant(createError(CartErrors.ProductAlreadyInCart, [data.productId])), u.I)
          .chain(() =>
            Async.of(data)
              .chain(readAndValidateStockProducts(ErrorValidationMap))
              .map(constant({events:[createEvent(CartEvents.ProductAdded, data)]}))
          )},
      UpdateQuantity: ({state}, data, {params}) =>{
        if(!state) return Async.Rejected(createError(CartErrors.CartDoesNotExist, [params.id]))
        return validateProductInCart(state, data.productId)
          .map(constant(data)) // .map(()=> data)
          .chain(u.cond([
            [data => data.quantity < 0, constant(Async.Rejected(
              createError(CartErrors.NegativeQuantity, [data.productId])
            ))],
            [data => data.quantity === 0, constant(Async.of(
             [createEvent(CartEvents.QuantityUpdated, data), createEvent(CartEvents.ProductRemoved, u.pick(['productId'], data))]
            ))],
            [u.T, ()=>
              Async.of(data)
                .chain(readAndValidateStockProducts(u.pick(['ProductOutOfStock'], ErrorValidationMap)))
                .map(constant({events:[createEvent(CartEvents.QuantityUpdated, data)]} as CommandHandlerResponse))
                //constant(value:any) => () => value

            ]
          ]))},
      RemoveProduct: ({state}, data, {params}) => {
        if(!state) return Async.Rejected(createError(CartErrors.CartDoesNotExist, [params.id]))
        return validateProductInCart(state, data)
          .map(constant({events:[createEvent(CartEvents.ProductRemoved, {productId: data})]}))},

      CloseCart: ({state}, data, {params}) =>{
        if(!state) return Async.Rejected(createError(CartErrors.CartDoesNotExist, [params.id]))
        if(!state.products)  return Async.Rejected(createError(CartErrors.EmptyCart, [params.id])) //TODO: No funciona el isNil??
        // return u.safeAsync(isNil, state.products)
        // .bimap(constant(createError(CartErrors.EmptyCart, [params.id])), u.I)
        // .chain(() => Async.of({events:[createEvent(CartEvents.CartClosed, null)]}))},
        return Async.of({events:[createEvent(CartEvents.CartClosed, null)]})},
    }
  })
}
