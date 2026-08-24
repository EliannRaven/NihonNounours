import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import {
  readExploreContext,
  switchExploreMode,
  type ExploreMode,
} from '../lib/exploreContext'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const context = readExploreContext(searchParams)
  const contextValues = [context.city, context.area, context.category].filter(
    (value): value is string => value !== null,
  )

  const selectMode = (mode: ExploreMode) => {
    setSearchParams(switchExploreMode(searchParams, mode))
  }

  return (
    <PageContainer>
      <div className="explore-page">
        <header className="explore-header">
          <h1>Explore</h1>
          <p>Choose what you feel like discovering.</p>
        </header>

        <fieldset className="explore-mode">
          <legend className="visually-hidden">Explore mode</legend>
          <button
            type="button"
            aria-pressed={context.mode === 'activities'}
            onClick={() => selectMode('activities')}
          >
            Activities
          </button>
          <button
            type="button"
            aria-pressed={context.mode === 'food'}
            onClick={() => selectMode('food')}
          >
            Food
          </button>
        </fieldset>

        <section className="explore-context" aria-labelledby="explore-context-title">
          <h2 id="explore-context-title">
            {context.mode === 'food' ? 'Food' : 'Activities'}
          </h2>
          {contextValues.length > 0 ? (
            <div className="explore-context__chips">
              {contextValues.map((value) => (
                <span key={value} className="pill">
                  {value}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </PageContainer>
  )
}
