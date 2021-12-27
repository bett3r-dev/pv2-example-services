import { ProductEvents } from '@bett3r-dev/pv2-example-domain';
import { CommittedEvent, Projector } from '@bett3r-dev/server-core';
import { AppServiceParams } from 'src/types';

export const ProductsProjectors = (params: AppServiceParams) : Projector<typeof ProductEvents> => {
  const {serverComponents:{database:{mongo}}, u} = params;

  const updateStock = (event: CommittedEvent<number>) =>
    mongo
      .getCollection('products')
      .update({id: event.metadata.id}, {$set: { quantity: event.data , lastEvent: event}});

  const restoreStock = (event: CommittedEvent<number>) =>
      mongo
        .getCollection('products')
        .update({id: event.metadata.id}, {$inc: { quantity: +event.data }});
  const decreaseStock = (event: CommittedEvent<number>) =>
      mongo
        .getCollection('products')
        .update({id: event.metadata.id}, {$inc: { quantity: -event.data }});


  return ({
    name: 'Products',
    eventProjectors: {
      ProductCreated: (event) =>
        mongo.getCollection('products').upsert({id: event.metadata.id}, {$set:{...event.data, id: event.metadata.id}}),
      ProductDeleted: (event) => mongo.getCollection('products').destroy({id: event.metadata.id}),
      StockUpdated: updateStock,
      StockDecreased: decreaseStock,
      StockRestored: restoreStock
    }
  })
}
