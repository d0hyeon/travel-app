import { Directory, File, Paths } from 'expo-file-system'
import { Asset, requestPermissionsAsync } from 'expo-media-library'

export async function savePhotoToLibrary(url: string): Promise<'saved' | 'denied'> {
  const permission = await requestPermissionsAsync(true, ['photo'])
  if (!permission.granted) return 'denied'

  const file = await File.downloadFileAsync(url, new Directory(Paths.cache))
  try {
    await Asset.create(file.uri)
  } finally {
    file.delete()
  }
  return 'saved'
}
