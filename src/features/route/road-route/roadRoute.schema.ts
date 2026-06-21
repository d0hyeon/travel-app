import { defineStore, field } from "schema-idb";
import type { TransportType } from "../route.types";

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
})
