import type { FormEvent } from 'react'
import type { Language } from '../i18n/translations'

type DebuggerProps = {
  t: (key: string) => string
  reqMethod: string
  setReqMethod: (method: string) => void
  reqPath: string
  setReqPath: (path: string) => void
  reqBody: string
  setReqBody: (body: string) => void
  reqResult: string
  sendRawRequest: (e: FormEvent) => void
}

export default function Debugger(props: DebuggerProps) {
  const { t, reqMethod, setReqMethod, reqPath, setReqPath } = props
  const { reqBody, setReqBody, reqResult, sendRawRequest } = props

  return (
    <form className="panel" onSubmit={sendRawRequest}>
      <h3>{t('requestDebugger')}</h3>
      <div className="row">
        <select value={reqMethod} onChange={(e) => setReqMethod(e.target.value)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <input value={reqPath} onChange={(e) => setReqPath(e.target.value)} placeholder={t('path')} />
      </div>
      <textarea value={reqBody} onChange={(e) => setReqBody(e.target.value)} placeholder={t('body')} />
      <button type="submit">{t('send')}</button>
      <pre>{reqResult}</pre>
    </form>
  )
}
