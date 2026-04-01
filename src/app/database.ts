import { openDB } from "schema-idb";
import { roadPathSchema } from "./route/road-path/roadPath.schema";

export const database = openDB({
  name: 'travel-app',
  stores: [roadPathSchema],
  versionStrategy: 'auto',
  removedStoreStrategy: 'preserve',
})