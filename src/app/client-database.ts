import { openDB } from "schema-idb";
import { roadRouteSchema } from "./route/road-route/roadRoute.schema";

export const clientDatabase = openDB({
  name: 'travel-app',
  stores: [roadRouteSchema],
  versionStrategy: 'auto',
  removedStoreStrategy: 'preserve',
})
