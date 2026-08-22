import type { Coordinate } from './coordinate.types'
export function isKoreaCoordinate(lat: number, lng: number): boolean { return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132 }
export function isOverseasByCoordinate(coordinate: Coordinate): boolean;
export function isOverseasByCoordinate(lat: number, lng: number): boolean;
export function isOverseasByCoordinate(...args: [number, number] | [Coordinate]): boolean { const [lat, lng] = args.length === 2 ? args : [args[0].lat, args[0].lng]; return !isKoreaCoordinate(lat, lng) }
export function calcDistance(a: Coordinate, b: Coordinate): number { const R = 6371000, toRad = (deg: number) => deg * Math.PI / 180, dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng), sinDLat = Math.sin(dLat / 2), sinDLng = Math.sin(dLng / 2), x = sinDLat ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng ** 2; return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) }
