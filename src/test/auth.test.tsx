/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock API
vi.mock('@/lib/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({
      id: '1',
      email: 'planner@railway.gov',
      full_name: 'Test Planner',
      role: 'PLANNER',
    }),
  },
  healthApi: {
    getHealth: vi.fn().mockResolvedValue({ status: 'ok' })
  },
  dashboardApi: {
    getSummary: vi.fn().mockResolvedValue({})
  }
}))

function TestDashboard() {
  const { user } = useAuth()
  return <div>Welcome {user?.full_name}</div>
}

function TestLogin() {
  return <div>Login Page</div>
}

const queryClient = new QueryClient()

describe('Authentication & Protected Routes', () => {
  it('redirects to login if not authenticated', async () => {
    // Clear localStorage to simulate unauthenticated
    localStorage.removeItem('railblock_access_token')

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/login" element={<TestLogin />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<TestDashboard />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Should wait for loading to finish, then we should see "Login Page"
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeTruthy()
    })
  })

  it('allows access to protected route if authenticated', async () => {
    // Set a dummy token
    localStorage.setItem('railblock_access_token', 'dummy-token')

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/login" element={<TestLogin />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<TestDashboard />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Should see "Welcome Test Planner" eventually
    await waitFor(() => {
      expect(screen.getByText('Welcome Test Planner')).toBeTruthy()
    })
  })
})
