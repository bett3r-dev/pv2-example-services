import {Event} from '@bett3r-dev/server-core'
import joi from 'joi';

export const UserRegistered: Event<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
})
export const UserLoggedIn: Event<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
})
export const UserLoggedOut: Event<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
})