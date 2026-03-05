import type { FormEvent } from 'react'
import type { Language } from '../i18n/translations'
import type { Agent } from '../types'

type AgentsProps = {
  t: (key: string) => string
  agents: Agent[]
  agentStats: Record<string, unknown> | null
  agentName: string
  setAgentName: (name: string) => void
  agentCapability: string
  setAgentCapability: (capability: string) => void
  registerAgent: (e: FormEvent) => void
  loadAgents: () => void
  loadAgentStats: () => void
}

export default function Agents(props: AgentsProps) {
  const { t, agents, agentName, setAgentName } = props
  const { agentCapability, setAgentCapability, registerAgent, loadAgents } = props

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; class: string }> = {
      online: { text: '在线', class: 'status-online' },
      offline: { text: '离线', class: 'status-offline' },
      busy: { text: '工作中', class: 'status-busy' },
      idle: { text: '空闲', class: 'status-idle' },
      error: { text: '错误', class: 'status-error' }
    }
    return statusMap[status] || statusMap.offline
  }

  const getAgentInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="agents-container">
      <div className="agents-header">
        <form className="agent-register-form" onSubmit={registerAgent}>
          <h3>{t('registerAgent')}</h3>
          <div className="form-row">
            <input 
              value={agentName} 
              onChange={(e) => setAgentName(e.target.value)} 
              placeholder={t('agentName')}
              required
            />
            <input 
              value={agentCapability} 
              onChange={(e) => setAgentCapability(e.target.value)} 
              placeholder={t('capability')}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">{t('registerBtn')}</button>
            <button type="button" className="btn-secondary" onClick={() => void loadAgents()}>
              {t('reloadList')}
            </button>
          </div>
        </form>
      </div>

      <div className="agents-grid">
        {agents.length === 0 ? (
          <div className="empty-state">
            <p>{t('noAgents') || '暂无智能体'}</p>
          </div>
        ) : (
          agents.map((agent) => {
            const status = getStatusBadge(agent.status)
            return (
              <div key={agent.id} className="agent-card">
                <div className="agent-card-header">
                  <div className="agent-avatar">
                    {getAgentInitial(agent.name)}
                  </div>
                  <div className="agent-info">
                    <h3>{agent.name}</h3>
                    <p className="agent-description">{agent.description || '无描述'}</p>
                  </div>
                  <span className={`status-badge ${status.class}`}>{status.text}</span>
                </div>
                
                <div className="agent-stats">
                  <div className="agent-stat">
                    <div className="agent-stat-value">{agent.current_load || 0}</div>
                    <div className="agent-stat-label">当前负载</div>
                  </div>
                  <div className="agent-stat">
                    <div className="agent-stat-value">{agent.max_concurrent_tasks || 0}</div>
                    <div className="agent-stat-label">最大任务</div>
                  </div>
                  <div className="agent-stat">
                    <div className="agent-stat-value">
                      {agent.last_heartbeat ? '活跃' : '未知'}
                    </div>
                    <div className="agent-stat-label">心跳状态</div>
                  </div>
                </div>

                <div className="agent-meta">
                  <div className="agent-meta-item">
                    <span className="agent-meta-label">创建时间:</span>
                    <span className="agent-meta-value">
                      {new Date(agent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="agent-meta-item">
                    <span className="agent-meta-label">更新时间:</span>
                    <span className="agent-meta-value">
                      {new Date(agent.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
