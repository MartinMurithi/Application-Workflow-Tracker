import { createContext, useContext, useState } from 'react'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('x-role') || 'applicant')

  const switchRole = (newRole) => {
    localStorage.setItem('x-role', newRole)
    setRole(newRole)
  }

  return (
    <RoleContext.Provider value={{ role, switchRole, isReviewer: role === 'reviewer' }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
