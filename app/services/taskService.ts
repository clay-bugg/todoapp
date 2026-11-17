
import type { Task, TaskPriority } from '../types/task'
import type { TaskRepository } from '../repositories/taskRepository'

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string | null
  projectId?: string | null
  parentTaskId?: string | null
}

export class TaskService {
  constructor(private repository: TaskRepository) {}

  async getTasks(): Promise<Task[]> {
    return this.repository.getAll()
  }

  async getTask(id: string): Promise<Task | null> {
    return this.repository.getById(id)
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString()

    let projectId = input.projectId ?? null
    const parentTaskId = input.parentTaskId ?? null

    // Subtasks inherit their parent's project.
    if (parentTaskId) {
      const parent = await this.repository.getById(parentTaskId)

      if (!parent) {
        throw new Error('Parent task does not exist')
      }

      projectId = parent.projectId
    }

    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description ?? '',
      completed: false,
      priority: input.priority ?? 2,
      dueDate: input.dueDate ?? null,
      projectId,
      parentTaskId,
      createdAt: now,
      updatedAt: now
    }

    if (!task.title) {
      throw new Error('Task title cannot be empty')
    }

    return this.repository.create(task)
  }

  async updateTask(
    id: string,
    changes: Partial<Pick<Task,
      'title' | 'description' | 'completed' | 'priority' | 'dueDate' | 'projectId'
    >>
  ): Promise<Task> {
    const existing = await this.repository.getById(id)

    if (!existing) {
      throw new Error('Task does not exist')
    }

    const updated: Task = {
      ...existing,
      ...changes,
      title: changes.title?.trim() ?? existing.title,
      updatedAt: new Date().toISOString()
    }

    if (!updated.title) {
      throw new Error('Task title cannot be empty')
    }

    await this.repository.update(updated)

    // Moving a parent task also moves its descendants.
    if (
      changes.projectId !== undefined &&
      changes.projectId !== existing.projectId
    ) {
      await this.updateDescendantProjects(id, updated.projectId)
    }

    return updated
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.repository.getAll()

    const deleteIds = new Set<string>([id])

    // Find every descendant, including nested subtasks.
    let foundNewDescendants = true

    while (foundNewDescendants) {
      foundNewDescendants = false

      for (const task of tasks) {
        if (
          task.parentTaskId &&
          deleteIds.has(task.parentTaskId) &&
          !deleteIds.has(task.id)
        ) {
          deleteIds.add(task.id)
          foundNewDescendants = true
        }
      }
    }

    for (const taskId of deleteIds) {
      await this.repository.delete(taskId)
    }
  }

  private async updateDescendantProjects(
    parentId: string,
    projectId: string | null
  ): Promise<void> {
    const tasks = await this.repository.getAll()

    const descendants = new Set<string>([parentId])

    let foundNewDescendants = true

    while (foundNewDescendants) {
      foundNewDescendants = false

      for (const task of tasks) {
        if (
          task.parentTaskId &&
          descendants.has(task.parentTaskId) &&
          !descendants.has(task.id)
        ) {
          descendants.add(task.id)
          foundNewDescendants = true
        }
      }
    }

    for (const task of tasks) {
      if (descendants.has(task.id) && task.id !== parentId) {
        await this.repository.update({
          ...task,
          projectId,
          updatedAt: new Date().toISOString()
        })
      }
    }
  }
}
