
export type TaskPriority = 1 | 2 | 3 | 4

export interface Task {
  id: string
  title: string
  description: string

  completed: boolean
  priority: TaskPriority

  dueDate: string | null
  projectId: string | null
  parentTaskId: string | null

  createdAt: string
  updatedAt: string
}
