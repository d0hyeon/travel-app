import { defineStore, field } from "schema-idb";

export const roadPathSchema = defineStore('roadPaths', {
  key: field.string().primaryKey().index(),
  coordinates: field.object(t => ({
    lat: t.number(),
    lng: t.number(),
  })).array(),
})
