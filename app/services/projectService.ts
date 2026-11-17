
import type { Project } from '../types/project'
import type { ProjectRepository } from '../repositories/projectRepository'
import type { TaskService } from './taskService'

export interface CreateProjectInput {
  name: string
  description?: string
  icon?: string | null
  color?: string | null
}

export class ProjectService {
  constructor(
    private repository: ProjectRepository,
    private taskService: TaskService
  ) {}

  async getProjects(): Promise<Project[]> {
    return this.repository.getAll()
  }

  async getProject(id: string): Promise<Project | null> {
    return this.repository.getById(id)
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const name = input.name.trim()

    if (!name) {
      throw new Error('Project name cannot be empty')
    }

    const now = new Date().toISOString()

    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description: input.description ?? '',
      icon: input.icon ?? null,
      color: input.color ?? null,
      createdAt: now,
      updatedAt: now
    }

    return this.repository.create(project)
  }

  async updateProject(
    id: string,
    changes: Partial<Pick<
      Project,
      'name' | 'description' | 'icon' | 'color'
    >>
  ): Promise<Project> {
    const existing = await this.repository.getById(id)

    if (!existing) {
      throw new Error('Project does not exist')
    }

    const updated: Project = {
      ...existing,
      ...changes,
      name: changes.name?.trim() ?? existing.name,
      updatedAt: new Date().toISOString()
    }

    if (!updated.name) {
      throw new Error('Project name cannot be empty')
    }

    return this.repository.update(updated)
  }

  async deleteProject(id: string): Promise<void> {
    const project = await this.repository.getById(id)

    if (!project) {
      throw new Error('Project does not exist')
    }

    const tasks = await this.taskService.getTasks()

    // Delete top-level tasks. TaskService handles their descendants.
    const projectTasks = tasks.filter(
      task => task.projectId === id && task.parentTaskId === null
    )

    for (const task of projectTasks) {
      await this.taskService.deleteTask(task.id)
    }

    await this.repository.delete(id)
  }
}
