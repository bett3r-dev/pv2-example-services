import { Command } from "@bett3r-dev/server-core";
import joi from 'joi';
import { UserLoggedIn, UserLoggedOut, UserRegistered } from "./authentication.events";

export const RegisterUser: Command<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
  isPublic: false,
  events: [UserRegistered]
})

export const LoginUser: Command<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
  isPublic: false,
  events: [UserLoggedIn]
})

export const LogoutUser: Command<{username:string}> = () => ({
  schema: joi.object().keys({username: joi.string()}),
  isPublic: false,
  events: [UserLoggedOut]
})