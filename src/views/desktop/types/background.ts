export type BackgroundFit = 'repeat' | 'stretch' | 'contain' | 'cover'

export interface BackgroundPhoto {
  url: string
  name: string
  fit: BackgroundFit
}

export interface SavedBackground {
  blob: Blob
  name: string
  fit: BackgroundFit
}

export type LoadedBackground = SavedBackground & BackgroundPhoto
