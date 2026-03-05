import type { FormEvent } from 'react'
import type { Language } from '../i18n/translations'
import type { Task, Workspace } from '../types'

type TasksProps = {
  language: Language
  t: (key: string) => string
  tasks: Task[]
  workspaces: Workspace[]
  taskTitle: string
  setTaskTitle: (title: string) => void
  taskDesc: string
  setTaskDesc: (desc: string) => void
  taskPriority: string
  setTaskPriority: (priority: string) => void
  selectedWorkspaceId: string
  setSelectedWorkspaceId: (id: string) => void
  createTask: (e: FormEvent) => void
  loadTasks: () => void
}

export default function Tasks(props: TasksProps) {
  const { language, t, tasks, workspaces } = props
  const { taskTitle, setTaskTitle, taskDesc, setTaskDesc } = props
  const { taskPriority, setTaskPriority, selectedWorkspaceId, setSelectedWorkspaceId } = props
  const { createTask, loadTasks } = props

  return (
    <div className="grid two">
      <form className="panel" onSubmit={createTask}>
        <h3>{t('createTask')}</h3>
        <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={t('taskTitle')} />
        <input value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder={t('taskDescription')} />
        <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
          <option value="low">{t('low')}</option>
          <option value="medium">{t('medium')}</option>
          <option value="high">{t('high')}</option>
        </select>
        <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
          <option value="">{t('selectWorkspace')}</option>
          {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <div className="row">
          <button type="submit">{t('create')}</button>
          <button type="button" className="ghost" onClick={() => void loadTasks()}>{t('reload')}</button>
        </div>
      </form>
      <div className="panel">
        <h3>{t('taskList')}</h3>
        <pre>{JSON.stringify(tasks, null, 2)}</pre>
      </div>
    </div>
  )
}
