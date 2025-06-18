/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as chats_ai from "../chats/ai.js";
import type * as chats_delete from "../chats/delete.js";
import type * as chats_mutations from "../chats/mutations.js";
import type * as chats_permissions from "../chats/permissions.js";
import type * as chats_queries from "../chats/queries.js";
import type * as chats_table from "../chats/table.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as linking_mutations from "../linking/mutations.js";
import type * as linking_table from "../linking/table.js";
import type * as messages_mutations from "../messages/mutations.js";
import type * as messages_queries from "../messages/queries.js";
import type * as messages_table from "../messages/table.js";
import type * as storage from "../storage.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "chats/ai": typeof chats_ai;
  "chats/delete": typeof chats_delete;
  "chats/mutations": typeof chats_mutations;
  "chats/permissions": typeof chats_permissions;
  "chats/queries": typeof chats_queries;
  "chats/table": typeof chats_table;
  crons: typeof crons;
  http: typeof http;
  "linking/mutations": typeof linking_mutations;
  "linking/table": typeof linking_table;
  "messages/mutations": typeof messages_mutations;
  "messages/queries": typeof messages_queries;
  "messages/table": typeof messages_table;
  storage: typeof storage;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
