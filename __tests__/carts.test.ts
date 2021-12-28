import { CartCommands } from '@bett3r-dev/pv2-example-domain';
import * as u from 'src/app-utils';
import { AppServerComponents } from 'src/types';
import { start } from '../../server';
import { CartsAggregate } from '../carts/carts.aggregate';

const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();
const mockDestroy = jest.fn();

describe.skip('happy path integration test', () => {
  let serverComponents: AppServerComponents;

  beforeAll((done) => {
    start({
      providers:{
        database:{
          mongo:{
            getCollection: () => ({
              upsert: mockUpsert,
              update: mockUpdate,
              create: mockCreate,
              destroy: mockDestroy
            })
          }
        }
      }
    })
      .map(({serverComponents: _serverCompoennts}) => {
        serverComponents = _serverCompoennts;
        _serverCompoennts.modulesLoadedStream.map(()=> done())
      })
      .fork(u.I, u.I)
  })
  it.skip('happy path', () => {
    const es = serverComponents.eventsourcing;
    es.executeCommand(CartsAggregate({serverComponents, u}), CartCommands.CreateUserCart)({
      params:{id:'438b476c-3a1e-45bc-bb43-c5c33798bd2c'},
      body:{
        "sku": "THE SKU TAL",
        "name": "Some Product",
        "price": 1234,
        "quantity": 500
      }
    }).map(() => {
      // serverComponents.eventstores['memory']._store; //?
    })
  });
});