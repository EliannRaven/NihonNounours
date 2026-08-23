import { Link } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer>
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link to="/today">Back to Today</Link>
    </PageContainer>
  )
}
