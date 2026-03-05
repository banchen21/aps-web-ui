import { createContext, ReactNode, useEffect, useState } from 'react'
import { translations, Language } from '../i18n/translations'
import { User, Workspace, Task, Agent } from '../types'

type AppContextType = {
  // Language & Theme
  language: Language
  setLanguage: (lang: Language) => void
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void
  translations: typeof translations
  
  // Auth
  user: User | null
  setUser: (user: User | null) => void
  token: string
  setToken: (token: string) => void
  
  // API
  baseUrl: string
  setBaseUrl: (url: string) => void
  
  // Data
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
}

export const AppContext = createContext<AppContextType | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('aps_language') as Language) || 'zh'
  )
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('aps_theme') as 'dark' | 'light') || 'dark'
  )
  const [baseUrl, setBaseUrl] = useState(
    localStorage.getItem('aps_base_url') || 'http://127.0.0.1:8000'
  )
  const [token, setToken] = useState(localStorage.getItem('aps_token') || '')
  const [user, setUser] = useState<User | null>(null)
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    localStorage.setItem('aps_language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('aps_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('aps_base_url', baseUrl)
  }, [baseUrl])

  useEffect(() => {
    localStorage.setItem('aps_token', token)
  }, [token])

  const value: AppContextType = {
    language,
    setLanguage,
    theme,
    setTheme,
    translations,
    user,
    setUser,
    token,
    setToken,
    baseUrl,
    setBaseUrl,
    workspaces,
    setWorkspaces,
    tasks,
    setTasks,
    agents,
    setAgents,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
