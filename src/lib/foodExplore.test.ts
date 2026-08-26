import { describe, expect, it } from 'vitest'
import type { Food } from '../types/trip'
import {
  filterFood,
  getFoodAreaOptions,
  getFoodCategoryOptions,
  normalizeFoodExploreParams,
  readFoodExploreFilters,
  resetFoodExploreParams,
  updateFoodExploreParams,
  type FoodExploreFilters,
} from './foodExplore'
import { getExploreCityOptions } from './exploreOptions'
import { getAllFood, getAllStages, getFoodForCity } from './tripData'

function food(overrides: Partial<Food> = {}): Food {
  return {
    id: 'FOD-TEST',
    name: 'Test Food',
    city: 'Kamakura',
    area: 'Jomyoji',
    category: 'Cafe',
    foodType: 'Matcha',
    favorite: false,
    reservation: null,
    price: null,
    about: null,
    info: null,
    important: null,
    ourNotes: null,
    websiteLink: null,
    ...overrides,
  }
}

function filters(overrides: Partial<FoodExploreFilters> = {}): FoodExploreFilters {
  return {
    city: 'Kamakura',
    area: null,
    category: null,
    favorites: false,
    ...overrides,
  }
}

describe('Food Explore filtering', () => {
  const source = [
    food({ id: 'matcha', favorite: true }),
    food({ id: 'meal', area: null, category: 'Meal' }),
    food({ id: 'kyoto', city: 'Kyoto', area: 'Kibune', category: 'Meal' }),
  ]

  it('filters by city, area, and category with case-insensitive matching', () => {
    expect(filterFood(source, filters()).map(({ id }) => id)).toEqual([
      'matcha',
      'meal',
    ])
    expect(
      filterFood(source, filters({ area: 'jomyoji' })).map(({ id }) => id),
    ).toEqual(['matcha'])
    expect(
      filterFood(source, filters({ category: 'cAFE' })).map(({ id }) => id),
    ).toEqual(['matcha'])
  })

  it('does not treat null area or category as a precise match', () => {
    expect(filterFood(source, filters({ area: 'Jomyoji' }))).not.toContainEqual(
      expect.objectContaining({ id: 'meal' }),
    )
    expect(
      filterFood(
        [food({ id: 'uncategorized', category: null })],
        filters({ category: 'Cafe' }),
      ),
    ).toEqual([])
  })

  it('filters favorites and combines filters with AND logic', () => {
    expect(
      filterFood(source, filters({ favorites: true })).map(({ id }) => id),
    ).toEqual(['matcha'])
    expect(
      filterFood(
        source,
        filters({ area: 'Jomyoji', category: 'Cafe', favorites: true }),
      ).map(({ id }) => id),
    ).toEqual(['matcha'])
  })

  it('returns a new array without mutating source Food objects', () => {
    const original = structuredClone(source)
    const result = filterFood(source, filters({ favorites: true }))

    expect(source).toEqual(original)
    expect(result).not.toBe(source)
  })
})

describe('Food Explore generated options', () => {
  it('extracts registry areas and omits null or blank values', () => {
    expect(
      getFoodAreaOptions([
        food({ area: 'Jomyoji' }),
        food({ area: '  jomyoji  ' }),
        food({ area: null }),
        food({ area: '  ' }),
      ]),
    ).toEqual(['Jomyoji'])
  })

  it('adds an absent contextual URL area first', () => {
    expect(
      getFoodAreaOptions(getFoodForCity('Kamakura'), 'Kamakura Station'),
    ).toEqual(['Kamakura Station', 'Jomyoji'])
  })

  it('deduplicates contextual area against a registry area', () => {
    expect(
      getFoodAreaOptions(getFoodForCity('Kamakura'), 'jomyoji'),
    ).toEqual(['Jomyoji'])
  })

  it('derives canonical categories and omits blank or null values', () => {
    expect(getFoodCategoryOptions(getAllFood())).toEqual([
      'Breakfast',
      'Cafe',
      'Meal',
      'Street Food',
    ])
    expect(
      getFoodCategoryOptions([
        food({ category: 'Cafe' }),
        food({ category: ' cafe ' }),
        food({ category: null }),
        food({ category: ' ' }),
      ]),
    ).toEqual(['Cafe'])
  })

  it('uses unique trip cities and includes Tokyo once', () => {
    const cities = getExploreCityOptions(getAllStages())
    expect(cities.filter((city) => city === 'Tokyo')).toHaveLength(1)
    expect(cities.slice(0, 4)).toEqual(['Sendai', 'Hiraizumi', 'Tokyo', 'Kamakura'])
  })
})

describe('Food Explore URL state', () => {
  const allFood = getAllFood()
  const cityFood = getFoodForCity('Kamakura')

  it('uses defaults for missing filters and accepts favorites=1 only', () => {
    expect(
      readFoodExploreFilters(
        new URLSearchParams(),
        'Kamakura',
        cityFood,
        allFood,
      ),
    ).toEqual(filters())
    expect(
      readFoodExploreFilters(
        new URLSearchParams('favorites=1'),
        'Kamakura',
        cityFood,
        allFood,
      ).favorites,
    ).toBe(true)
    expect(
      readFoodExploreFilters(
        new URLSearchParams('favorites=yes'),
        'Kamakura',
        cityFood,
        allFood,
      ).favorites,
    ).toBe(false)
  })

  it('removes blank area but preserves nonblank contextual area', () => {
    expect(
      readFoodExploreFilters(
        new URLSearchParams('area=%20%20'),
        'Kamakura',
        cityFood,
        allFood,
      ).area,
    ).toBeNull()
    expect(
      readFoodExploreFilters(
        new URLSearchParams('area=Kamakura+Station'),
        'Kamakura',
        cityFood,
        allFood,
      ).area,
    ).toBe('Kamakura Station')
  })

  it('canonicalizes valid category and rejects invalid category', () => {
    expect(
      readFoodExploreFilters(
        new URLSearchParams('category=cAFE'),
        'Kamakura',
        cityFood,
        allFood,
      ).category,
    ).toBe('Cafe')
    expect(
      readFoodExploreFilters(
        new URLSearchParams('category=Banana'),
        'Kamakura',
        cityFood,
        allFood,
      ).category,
    ).toBeNull()
  })

  it('normalizes Food state while preserving contextual area and future params', () => {
    const params = normalizeFoodExploreParams(
      new URLSearchParams('mode=food&weather=sunny&time=1-2h&future=kept'),
      filters({ area: 'Kamakura Station', category: 'Meal', favorites: true }),
    )

    expect(Object.fromEntries(params)).toEqual({
      future: 'kept',
      mode: 'food',
      city: 'Kamakura',
      area: 'Kamakura Station',
      category: 'Meal',
      favorites: '1',
    })
  })

  it('removes area, category, and favorites through default selections', () => {
    const start = new URLSearchParams(
      'mode=food&city=Kamakura&area=Jomyoji&category=Cafe&favorites=1',
    )
    const noArea = updateFoodExploreParams(start, { area: null })
    const noCategory = updateFoodExploreParams(noArea, { category: null })
    const noFavorites = updateFoodExploreParams(noCategory, { favorites: false })

    expect(Object.fromEntries(noFavorites)).toEqual({
      mode: 'food',
      city: 'Kamakura',
    })
  })

  it('clears area on city change while preserving category and favorites', () => {
    const params = updateFoodExploreParams(
      new URLSearchParams(
        'mode=food&city=Kamakura&area=Jomyoji&category=Cafe&favorites=1',
      ),
      { city: 'Kyoto' },
    )

    expect(params.get('city')).toBe('Kyoto')
    expect(params.has('area')).toBe(false)
    expect(params.get('category')).toBe('Cafe')
    expect(params.get('favorites')).toBe('1')
  })

  it('reset preserves city and unrelated params while clearing Food filters', () => {
    const params = resetFoodExploreParams(
      new URLSearchParams(
        'mode=food&city=Kamakura&area=Jomyoji&category=Cafe&favorites=1&future=kept',
      ),
      'Kamakura',
    )

    expect(Object.fromEntries(params)).toEqual({
      mode: 'food',
      city: 'Kamakura',
      future: 'kept',
    })
  })
})
