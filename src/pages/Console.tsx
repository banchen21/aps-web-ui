import { useState } from 'react'
import type { Language } from '../i18n/translations'

type ConsoleProps = {
  language: Language
  t: (key: string) => string
}

type TimePeriod = 'hour' | 'day' | 'week'

export default function Console({ language, t }: ConsoleProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('hour')

  const handleViewAll = () => {
    alert(language === 'zh' ? '查看所有活动功能开发中...' : 'View all activities feature coming soon...')
  }

  return (
    <div className="console-container">
      <div className="panel">
        <h3>{t('systemOverview')}</h3>
      </div>

      <div className="console-stats">
        <div className="console-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('createdTasks')}</div>
            <div className="stat-value">24</div>
            <div className="stat-change positive">+12%</div>
          </div>
        </div>

        <div className="console-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('onlineAgents')}</div>
            <div className="stat-value">156</div>
            <div className="stat-change positive">+8%</div>
          </div>
        </div>

        <div className="console-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('activeTasks')}</div>
            <div className="stat-value">99.8%</div>
            <div className="stat-change negative">-3%</div>
          </div>
        </div>

        <div className="console-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">{t('systemAvailability')}</div>
            <div className="stat-value">42%</div>
          </div>
        </div>
      </div>

      <div className="console-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3>{t('taskTrend')}</h3>
            <div className="time-tabs">
              <button
                className={timePeriod === 'hour' ? 'active' : ''}
                onClick={() => setTimePeriod('hour')}
              >
                {t('hour')}
              </button>
              <button
                className={timePeriod === 'day' ? 'active' : ''}
                onClick={() => setTimePeriod('day')}
              >
                {t('day')}
              </button>
              <button
                className={timePeriod === 'week' ? 'active' : ''}
                onClick={() => setTimePeriod('week')}
              >
                {t('week')}
              </button>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--primary)' }}></span>
              <span>{t('completedTasks')}</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: 'var(--success)' }}></span>
              <span>{t('newTasks')}</span>
            </div>
          </div>
          <div className="chart-area">
            <svg viewBox="0 0 600 200" className="chart-svg">
              <defs>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'var(--success)', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--success)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path d="M 0 150 L 100 120 L 200 140 L 300 100 L 400 110 L 500 80 L 600 90" stroke="var(--primary)" strokeWidth="2" fill="none" />
              <path d="M 0 150 L 100 120 L 200 140 L 300 100 L 400 110 L 500 80 L 600 90 L 600 200 L 0 200 Z" fill="url(#blueGradient)" />
              <path d="M 0 180 L 100 160 L 200 170 L 300 140 L 400 150 L 500 130 L 600 140" stroke="var(--success)" strokeWidth="2" fill="none" />
              <path d="M 0 180 L 100 160 L 200 170 L 300 140 L 400 150 L 500 130 L 600 140 L 600 200 L 0 200 Z" fill="url(#greenGradient)" />
            </svg>
          </div>
        </div>

        <div className="activity-list">
          <div className="activity-header">
            <h3>{t('recentActivity')}</h3>
            <button className="view-all-btn" onClick={handleViewAll}>{t('viewAll')}</button>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✓</div>
            <div className="activity-content">
              <p className="activity-text">{language === 'zh' ? '任务 #2341 已完成' : 'Task #2341 completed'}</p>
              <p className="activity-time">{language === 'zh' ? '2 分钟前' : '2 minutes ago'}</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🤖</div>
            <div className="activity-content">
              <p className="activity-text">{language === 'zh' ? '新智能体已上线' : 'New agent online'}</p>
              <p className="activity-time">{language === 'zh' ? '15 分钟前' : '15 minutes ago'}</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">⚠️</div>
            <div className="activity-content">
              <p className="activity-text">{language === 'zh' ? '系统负载较高' : 'High system load'}</p>
              <p className="activity-time">{language === 'zh' ? '32 分钟前' : '32 minutes ago'}</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">💾</div>
            <div className="activity-content">
              <p className="activity-text">{language === 'zh' ? '数据库备份完成' : 'Database backup completed'}</p>
              <p className="activity-time">{language === 'zh' ? '1 小时前' : '1 hour ago'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
