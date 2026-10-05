import { Locations } from '@waylog/domains/modules/location'
import { PlaceCategoryTypes } from '@waylog/domains/modules/place'
import { describe, expect, it } from 'vitest'
import { buildExplorerDetailParams } from '../explorer.utils'

const [location] = Locations
const [category] = PlaceCategoryTypes

describe('buildExplorerDetailParams', () => {
  it('위치와 카테고리가 있으면 그대로 넘긴다', () => {
    expect(buildExplorerDetailParams(location, category)).toEqual({ location, category })
  })

  it('위치를 해제했으면 파라미터를 생략하지 않고 빈 문자열로 해제를 명시한다', () => {
    expect(buildExplorerDetailParams(undefined, category)).toEqual({ location: '', category })
  })

  it('카테고리를 해제했으면 빈 문자열로 해제를 명시한다', () => {
    expect(buildExplorerDetailParams(location, undefined)).toEqual({ location, category: '' })
  })
})
