import "server-only";
import { clientEnv } from "./client";
import { serverEnv } from "./server";

/**
 * Merged environment for backend code: public + server vars in one object.
 *
 * Server Components, Server Actions, Route Handlers, and lib/db import `env`
 * from here. This module is server-only; client code must import `clientEnv`
 * from ./client instead.
 */
export const env = { ...clientEnv, ...serverEnv };
