import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

export const useTranslation = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useTranslation must be used within AppProvider')
  }
  
  const { language, translations } = context
  
  const t = (key: keyof typeof translations.zh) => translations[language][key]
  
  return { t, language }
}
