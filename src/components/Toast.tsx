import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
  duration?: number
}

interface ToastProps {
  messages: ToastMessage[]
  onRemove: (id: string) => void
}

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ message, onRemove }: { message: ToastMessage; onRemove: (id: string) => void }) {
  useEffect(() => {
    const duration = message.duration || 3000
    const timer = setTimeout(() => onRemove(message.id), duration)
    return () => clearTimeout(timer)
  }, [message.id, message.duration, onRemove])

  const isSuccess = message.type === 'success'
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500'
  const Icon = isSuccess ? CheckCircle : AlertCircle

  return (
    <div
      className={`${bgColor} text-white rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full duration-300 pointer-events-auto`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm">{message.message}</p>
      <button
        onClick={() => onRemove(message.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
