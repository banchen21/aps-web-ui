import { useState } from 'react'
import type { Language } from '../i18n/translations'

type MonitorProps = {
  language: Language
  t: (key: string) => string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkTraffic: number
}

type ChartType = 'cpu' | 'memory' | 'disk' | 'network'

export default function Monitor({ t, cpuUsage, memoryUsage, diskUsage, networkTraffic }: MonitorProps) {
  const [chartType, setChartType] = useState<ChartType>('cpu')

  const getChartColor = () => {
    switch (chartType) {
      case 'cpu': return 'var(--primary)'
      case 'memory': return 'var(--success)'
      case 'disk': return 'var(--warning)'
      case 'network': return 'var(--error)'
      default: return 'var(--primary)'
    }
  }

  const getChartValue = () => {
    switch (chartType) {
      case 'cpu': return cpuUsage
      case 'memory': return memoryUsage
      case 'disk': return diskUsage
      case 'network': return networkTraffic
      default: return 0
    }
  }

  return (
    <div className="monitor-container">
      <div className="panel">
        <h3>{t('realtimeSystemResources')}</h3>
      </div>

      <div className="monitor-stats">
        <div className="stat-card">
          <div className="stat-label">{t('cpuUsage')}</div>
          <div className="stat-value">{cpuUsage}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${cpuUsage}%`, background: 'var(--primary)' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('memoryUsage')}</div>
          <div className="stat-value">{memoryUsage}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${memoryUsage}%`, background: 'var(--success)' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('diskUsage')}</div>
          <div className="stat-value">{diskUsage}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${diskUsage}%`, background: 'var(--warning)' }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('networkTraffic')}</div>
          <div className="stat-value">{networkTraffic} MB/s</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${Math.min(networkTraffic / 2, 100)}%`, background: 'var(--error)' }}></div>
          </div>
        </div>
      </div>

      <div className="panel chart-panel">
        <h3>{t('realtimePerformanceChart')}</h3>
        <div className="chart-tabs">
          <button
            className={chartType === 'cpu' ? 'active' : ''}
            onClick={() => setChartType('cpu')}
          >
            {t('cpu')}
          </button>
          <button
            className={chartType === 'memory' ? 'active' : ''}
            onClick={() => setChartType('memory')}
          >
            {t('memory')}
          </button>
          <button
            className={chartType === 'disk' ? 'active' : ''}
            onClick={() => setChartType('disk')}
          >
            {t('disk')}
          </button>
          <button
            className={chartType === 'network' ? 'active' : ''}
            onClick={() => setChartType('network')}
          >
            {t('network')}
          </button>
        </div>
        <div className="chart-placeholder">
          <div className="chart-info">
            <span className="chart-label">{t(chartType)}</span>
            <span className="chart-current-value">
              {chartType === 'network' ? `${getChartValue()} MB/s` : `${getChartValue()}%`}
            </span>
          </div>
          <svg viewBox="0 0 800 300" className="performance-chart">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: getChartColor(), stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: getChartColor(), stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path
              d="M 0 250 L 100 200 L 200 180 L 300 220 L 400 150 L 500 170 L 600 140 L 700 160 L 800 120"
              stroke={getChartColor()}
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 0 250 L 100 200 L 200 180 L 300 220 L 400 150 L 500 170 L 600 140 L 700 160 L 800 120 L 800 300 L 0 300 Z"
              fill="url(#chartGradient)"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
