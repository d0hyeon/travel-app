export interface Photo {
  id: string
  tripId: string
  placeId: string | null;
  isPublic: boolean
  url: string
  storagePath: string
  createdAt: string
}

export interface PhotoUploadParams {
  tripId: string
  placeId?: string
  file: File
  isPublic: boolean
}
