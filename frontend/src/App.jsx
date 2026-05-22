import { Routes, Route } from 'react-router-dom'
import { RoleProvider } from './hooks/useRole'
import Layout from './components/Layout'
import ApplicationList from './pages/ApplicationList'
import ApplicationForm from './pages/ApplicationForm'
import ApplicationDetail from './pages/ApplicationDetail'

export default function App() {
  return (
    <RoleProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<ApplicationList />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        </Routes>
      </Layout>
    </RoleProvider>
  )
}
