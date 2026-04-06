import { defineStore, field } from "schema-idb";

export const roadRouteSchema = defineStore('roadRoutes', {
  key: field.string().primaryKey().index(),
  coordinates: field.object(t => ({
    lat: t.number(),
    lng: t.number(),
  })).array(),
})
