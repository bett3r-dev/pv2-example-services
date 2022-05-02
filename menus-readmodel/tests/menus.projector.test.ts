import * as u from '@bett3r-dev/server-utils';
import * as MenuEvents from 'src/domain/menu/menu.events';
import { createTestEnvironment, EventSourcingTest } from "src/serverComponents/eventsourcing/src/testing";
import { AppServiceParams } from 'src/types';
import { Menus } from '../menus.projectors';
import sinon from 'sinon';
import { assert } from 'chai';
import Async from '@bett3r-dev/crocks/Async';

const MongoStoreMock = (state = []) => ({
  read: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T) =>
    Async.of(state.filter(x => !Object.keys(filter).some((key) => filter[key] !== x[key])))
  ),
  upsert: sinon.stub().callsFake(<T extends Record<string, any>>(filter: T, data: {$set?: T, $addToSet?: T}) => {
    const index = state.findIndex(x => !Object.keys(filter).some((key) => filter[key] !== x[key]));
    state[index >= 0 ? index : 0] = u.merge(state[index] || {}, {...data.$set, ...data.$addToSet, ...filter});
    return Async.of();
  })
})

describe( 'MenuProjector', function() {
  let es: EventSourcingTest;
  let params: AppServiceParams
  let mockState = [];
  const mongo = MongoStoreMock(mockState);
  const menu =  {
      professionalId: '1470fbf9-d052-4a9e-bd57-b520f050c17c',
      name: 'menu name'
  }

  beforeAll(() => {
    es = createTestEnvironment().es;
    params = {
      u,
      serverComponents: {
        eventsourcing: es,
        database:{
          //@ts-ignore
          mongo: {getCollection: () => mongo}
        }
      }
    };
  })

  afterEach(() => {
    sinon.resetHistory();
    mockState.splice(0);
  })

  it('Given no previous events, when Menu Created then menu is inserted in DB', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Menus(params))
      .when(MenuEvents.MenuCreated, menu, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...menu});
      })
      .fork(done, () => done())
  });
  it('Given no previous events, when Menu Updated then menu is inserted in DB', done => {
    const id = 'dd6349f9-4409-41b1-9999-acfbf71cc178';
    es.testProjector(Menus(params))
      .when(MenuEvents.MenuUpdated, {...menu, name:"menu name updated"}, {id})
      .map(() => {
        assert.equal(mockState.length, 1);
        assert.deepNestedInclude(mockState[0], {...menu, name:"menu name updated"});
      })
      .fork(done, () => done())
  });

});
