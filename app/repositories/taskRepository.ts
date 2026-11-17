
import type { Task } from '../types/task'

export interface TaskRepository {
  getAll(): Promise<Task[]>
  getById(id: string): Promise<Task | null>
  create(task: Task): Promise<Task>
  update(task: Task): Promise<Task>
  delete(id: string): Promise<void>
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>()

  async getAll(): Promise<Task[]> {
    return Array.from(this.tasks.values())
  }

  async getById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null
  }

  async create(task: Task): Promise<Task> {
    if (this.tasks.has(task.id)) {
      throw new Error(`Task with ID ${task.id} already exists`)
    }

    this.tasks.set(task.id, task)
    return task
  }

  async update(task: Task): Promise<Task> {
    if (!this.tasks.has(task.id)) {
      throw new Error(`Task with ID ${task.id} does not exist`)
    }

    this.tasks.set(task.id, task)
    return task
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id)
  }
}
