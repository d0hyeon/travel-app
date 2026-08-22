import { defineStore, field } from "schema-idb";
import type { TransportType } from "@waylog/domains/modules/route";

export const roadRouteSchema = defineStore('roadRoutes', {
  key: field.string().primaryKey().index(),
  coordinates: field.object(t => ({
    lat: t.number(),
    lng: t.number(),
  })).array(),
  legs: field.object(t => ({
    duration: t.number(),
    distance: t.number(),
    transport: t.custom<TransportType>(),
    coordinates: field.object(t => ({
      lat: t.number(),
      lng: t.number(),
    })).array(),
  })).array(),
}).addMigration('reset-for-legs', (db, transition) => {
  const store = transition.objectStore('roadRoutes');
  store.clear();
})
