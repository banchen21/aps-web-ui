import type { FormEvent } from 'react'
import type { Language } from '../i18n/translations'
import type { Workspace } from '../types'

type WorkspacesProps = {
  language: Language
  t: (key: string) => string
  workspaces: Workspace[]
  filteredWorkspaces: Workspace[]
  workspaceFilter: string
  setWorkspaceFilter: (filter: string) => void
  workspaceName: string
  setWorkspaceName: (name: string) => void
  workspaceDesc: string
  setWorkspaceDesc: (desc: string) => void
  workspaceIsPublic: boolean
  setWorkspaceIsPublic: (isPublic: boolean) => void
  selectedWorkspaceId: string
  setSelectedWorkspaceId: (id: string) => void
  workspaceDetail: Workspace | null
  editingWorkspaceName: string
  setEditingWorkspaceName: (name: string) => void
  editingWorkspaceDesc: string
  setEditingWorkspaceDesc: (desc: string) => void
  editingWorkspaceIsPublic: boolean
  setEditingWorkspaceIsPublic: (isPublic: boolean) => void
  createWorkspace: (e: FormEvent) => void
  updateWorkspace: (e: FormEvent) => void
  deleteWorkspace: () => void
  loadWorkspaces: () => void
  loadWorkspaceDetail: (id: string) => void
  setSection: (section: string) => void
}

export default function Workspaces(props: WorkspacesProps) {
  const { language, t, filteredWorkspaces, workspaceFilter, setWorkspaceFilter } = props
  const { workspaceName, setWorkspaceName, workspaceDesc, setWorkspaceDesc } = props
  const { workspaceIsPublic, setWorkspaceIsPublic, createWorkspace } = props
  const { selectedWorkspaceId, setSelectedWorkspaceId, workspaceDetail } = props
  const { editingWorkspaceName, setEditingWorkspaceName, editingWorkspaceDesc, setEditingWorkspaceDesc } = props
  const { editingWorkspaceIsPublic, setEditingWorkspaceIsPublic, updateWorkspace, deleteWorkspace } = props
  const { loadWorkspaces, loadWorkspaceDetail, setSection } = props

  return (
    <div className="grid">
      <form className="panel" onSubmit={createWorkspace}>
        <h3>{t('createWorkspace')}</h3>
        <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder={t('workspaceName')} />
        <input value={workspaceDesc} onChange={(e) => setWorkspaceDesc(e.target.value)} placeholder={t('description')} />
        <label className="row">
          <input
            type="checkbox"
            checked={workspaceIsPublic}
            onChange={(e) => setWorkspaceIsPublic(e.target.checked)}
          />
          {t('isPublic')}
        </label>
        <div className="row">
          <button type="submit">{t('create')}</button>
          <button type="button" className="ghost" onClick={loadWorkspaces}>{t('reload')}</button>
        </div>
      </form>

      <article className="panel">
        <div className="workspace-header">
          <h3>{t('workspaceList')}</h3>
          <input
            className="search-input"
            placeholder={t('filter')}
            value={workspaceFilter}
            onChange={(e) => setWorkspaceFilter(e.target.value)}
          />
        </div>
        <div className="workspace-grid">
          {filteredWorkspaces.length === 0 ? (
            <p className="empty-state">{language === 'zh' ? '暂无工作空间' : 'No workspaces yet'}</p>
          ) : (
            filteredWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`workspace-card ${selectedWorkspaceId === workspace.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedWorkspaceId(workspace.id)
                  loadWorkspaceDetail(workspace.id)
                }}
              >
                <div className="workspace-card-header">
                  <h4>{workspace.name}</h4>
                  {workspace.is_public ? (
                    <span className="badge badge-public">{language === 'zh' ? '公开' : 'Public'}</span>
                  ) : (
                    <span className="badge badge-private">{language === 'zh' ? '私有' : 'Private'}</span>
                  )}
                </div>
                {workspace.description && (
                  <p className="workspace-desc">{workspace.description}</p>
                )}
                <div className="workspace-meta">
                  {workspace.owner_id && (
                    <div className="workspace-meta-item">
                      <strong>{language === 'zh' ? '所有者' : 'Owner'}:</strong>
                      <span>{workspace.owner_id}</span>
                    </div>
                  )}
                  {workspace.created_at && (
                    <div className="workspace-meta-item">
                      <strong>{language === 'zh' ? '创建时间' : 'Created'}:</strong>
                      <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="workspace-actions">
                  <button
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedWorkspaceId(workspace.id)
                      loadWorkspaceDetail(workspace.id)
                      setSection('workspaces')
                    }}
                  >
                    {t('edit')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      {workspaceDetail && (
        <form className="panel" onSubmit={updateWorkspace}>
          <h3>{t('workspaceDetail')}</h3>
          <input
            value={editingWorkspaceName}
            onChange={(e) => setEditingWorkspaceName(e.target.value)}
            placeholder={t('workspaceName')}
          />
          <input
            value={editingWorkspaceDesc}
            onChange={(e) => setEditingWorkspaceDesc(e.target.value)}
            placeholder={t('description')}
          />
          <label className="row">
            <input
              type="checkbox"
              checked={editingWorkspaceIsPublic}
              onChange={(e) => setEditingWorkspaceIsPublic(e.target.checked)}
            />
            {t('isPublic')}
          </label>
          <details>
            <summary>{language === 'zh' ? '原始数据' : 'Raw Data'}</summary>
            <pre>{JSON.stringify(workspaceDetail, null, 2)}</pre>
          </details>
          <div className="row">
            <button type="submit">{t('update')}</button>
            <button type="button" className="ghost error" onClick={deleteWorkspace}>{t('delete')}</button>
          </div>
        </form>
      )}
    </div>
  )
}
