import { create } from 'zustand'

interface AuthUser {
  discordId: string
  username: string
  avatar: string | null
  globalName: string | null
  avatarUrl: string
  isAdmin: boolean
}

interface AuthStore {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await fetch('/api/auth/logout')
    set({ user: null })
  },
}))

export async function fetchAuthUser() {
  const { setUser, setLoading } = useAuthStore.getState()
  try {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user ?? null)
  } catch {
    setUser(null)
  } finally {
    setLoading(false)
  }
}
