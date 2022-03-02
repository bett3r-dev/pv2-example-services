import { CartEvents, CartModel } from '@bett3r-dev/pv2-example-domain';
import { CommittedEvent, Projector } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const UserCartsProjectors = (params: AppServiceParams) : Projector<typeof CartEvents> => {
  const {serverComponents:{database:{mongo}}, u} = params;

  const updateProductQuantity = (event: CommittedEvent<{productId:string, quantity:number}>) =>
    mongo
      .getCollection('user-carts')
      // .update({id: event.metadata.id, products: {$elemMatch:{product: {$elemMatch:{ id: event.data.productId }}}}}, {$set: { 'products.$.quantity': event.data.quantity }, lastEvent: event});
      .update({id: event.metadata.id}, {$set: { [`products.${event.data.productId}.quantity`]: event.data.quantity , lastEvent: event}});

  const removeProduct = (event: CommittedEvent<{productId: string}>) =>
    mongo
      .getCollection('user-carts')
      .update({id: event.metadata.id}, {$unset: { [`products.${event.data.productId}`]: 1}});

  const closeCart = (event: CommittedEvent<CartModel>) =>
    mongo
      .getCollection('user-carts')
      .upsert({id: event.metadata.id}, {$set: {...event.data, isClosed: true, lastEvent: event}});

  return ({
    name: 'UserCarts',
    eventProjectors: {
      UserCartCreated: (event: CommittedEvent<{userId:string}>) =>{
        return mongo.getCollection('user-carts').upsert({id: event.metadata.id}, {$set:{ ...event.data, id:event.metadata.id, lastEvent:event}})
      },
      ProductAdded: (event) =>{
        return mongo.getCollection('user-carts').upsert({id: event.metadata.id}, {$set:{ [`products.${event.data.productId}`]:{...event.data}, id:event.metadata.id, lastEvent:event}})},
      QuantityUpdated: updateProductQuantity,
      CartClosed: closeCart,
      ProductRemoved: removeProduct,
    }
  })
}
