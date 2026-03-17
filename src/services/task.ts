const API_BASE_URL = 'http://localhost:8000/api/v1'

export type TaskStatusGroup = 'completed' | 'running' | 'pending' | 'failed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus =
  | 'published'
  | 'accepted'
  | 'executing'
  | 'submitted'
  | 'under_review'
  | 'completed_success'
  | 'completed_failure'
  | 'cancelled'

export interface TaskItem {
  id: string
  name: string
  description: string
  priority?: TaskPriority
  status: TaskStatus
  status_label: string
  status_group: TaskStatusGroup
  due_date?: string | null
  assigned_agent_id?: string | null
  assigned_agent_name?: string | null
  review_result?: string | null
  review_approved?: boolean | null
  created_at: string
  updated_at: string
}

export interface ReviewDecisionRequest {
  accept: boolean
}

export interface CreateTaskRequest {
  name: string
  description: string
  priority?: TaskPriority
  due_date?: string
}

const getAuthHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
})

export const taskService = {
  getTasks: async (): Promise<TaskItem[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取任务列表失败')
    return await response.json()
  },

  getTask: async (taskId: string): Promise<TaskItem> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: getAuthHeader(),
    })
    if (!response.ok) throw new Error('获取任务详情失败')
    return await response.json()
  },

  createTask: async (request: CreateTaskRequest): Promise<TaskItem> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) throw new Error('创建任务失败')
    if (response.status === 202 || response.status === 204) {
      return {
        id: '',
        name: request.name,
        description: request.description,
        priority: request.priority ?? 'medium',
        status: 'published',
        status_label: '等待中',
        status_group: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    return await response.json()
  },

  decideTaskReview: async (taskId: string, request: ReviewDecisionRequest): Promise<TaskItem> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/review-decision`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || '处理审阅决策失败')
    }
    return await response.json()
  },
}