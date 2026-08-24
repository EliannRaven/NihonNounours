import { describe, expect, it } from 'vitest'
import {
  buildExploreSearchParams,
  readExploreContext,
  switchExploreMode,
} from './exploreContext'

describe('Explore URL contract', () => {
  it('builds full Food discovery context', () => {
    const params = buildExploreSearchParams({
      mode: 'food',
      city: 'Kamakura',
      area: 'Kamakura Station',
      category: 'Meal',
    })

    expect(Object.fromEntries(params)).toEqual({
      mode: 'food',
      city: 'Kamakura',
      area: 'Kamakura Station',
      category: 'Meal',
    })
  })

  it('omits null and activities-only category parameters', () => {
    const params = buildExploreSearchParams({
      mode: 'activities',
      city: 'Kyoto',
      area: null,
    })

    expect(Object.fromEntries(params)).toEqual({
      mode: 'activities',
      city: 'Kyoto',
    })
  })

  it('trims outer whitespace without changing internal spaces', () => {
    const params = buildExploreSearchParams({
      mode: 'food',
      city: '  Kamakura  ',
      area: '  Kamakura Station  ',
      category: '   ',
    })

    expect(params.get('city')).toBe('Kamakura')
    expect(params.get('area')).toBe('Kamakura Station')
    expect(params.has('category')).toBe(false)
  })

  it('parses Food context from manually encoded parameters', () => {
    const context = readExploreContext(
      new URLSearchParams(
        'mode=food&city=Kamakura&area=Kamakura+Station&category=Meal',
      ),
    )

    expect(context).toEqual({
      mode: 'food',
      city: 'Kamakura',
      area: 'Kamakura Station',
      category: 'Meal',
    })
  })

  it('normalizes Activities category to null', () => {
    expect(
      readExploreContext(
        new URLSearchParams('mode=activities&city=Kamakura&category=Meal'),
      ),
    ).toEqual({
      mode: 'activities',
      city: 'Kamakura',
      area: null,
      category: null,
    })
  })

  it('defaults invalid mode and blank values safely', () => {
    expect(
      readExploreContext(new URLSearchParams('mode=banana&city=%20%20')),
    ).toEqual({
      mode: 'activities',
      city: null,
      area: null,
      category: null,
    })
  })

  it('removes Food category when switching to Activities', () => {
    const params = switchExploreMode(
      new URLSearchParams(
        'mode=food&city=Kamakura&area=Station&category=Meal&future=kept',
      ),
      'activities',
    )

    expect(params.get('mode')).toBe('activities')
    expect(params.get('city')).toBe('Kamakura')
    expect(params.get('area')).toBe('Station')
    expect(params.has('category')).toBe(false)
    expect(params.get('future')).toBe('kept')
  })

  it('does not invent category when switching Activities to Food', () => {
    const params = switchExploreMode(
      new URLSearchParams(
        'mode=activities&city=Kamakura&area=Hase&weather=sunny&time=under-1h&favorites=1&future=kept',
      ),
      'food',
    )

    expect(params.get('mode')).toBe('food')
    expect(params.get('city')).toBe('Kamakura')
    expect(params.get('area')).toBe('Hase')
    expect(params.has('category')).toBe(false)
    expect(params.has('weather')).toBe(false)
    expect(params.has('time')).toBe(false)
    expect(params.has('favorites')).toBe(false)
    expect(params.get('future')).toBe('kept')
  })
})
