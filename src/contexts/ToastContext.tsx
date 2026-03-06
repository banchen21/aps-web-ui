import { createContext, useContext, useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
  duration?: number
}

interface ToastContextType {
  messages: ToastMessage[]
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  removeMessage: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const addMessage = useCallback((type: 'success' | 'error', message: string, duration?: number) => {
    const id = Date.now().toString()
    const newMessage: ToastMessage = { id, type, message, duration }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    addMessage('success', message, duration)
  }, [addMessage])

  const showError = useCallback((message: string, duration?: number) => {
    addMessage('error', message, duration)
  }, [addMessage])

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ messages, showSuccess, showError, removeMessage }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
