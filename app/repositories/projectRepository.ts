
import type { Project } from '../types/project'

export interface ProjectRepository {
  getAll(): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(project: Project): Promise<Project>
  update(project: Project): Promise<Project>
  delete(id: string): Promise<void>
}

export class InMemoryProjectRepository implements ProjectRepository {
  private projects = new Map<string, Project>()

  async getAll(): Promise<Project[]> {
    return Array.from(this.projects.values())
  }

  async getById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null
  }

  async create(project: Project): Promise<Project> {
    if (this.projects.has(project.id)) {
      throw new Error(`Project with ID ${project.id} already exists`)
    }

    this.projects.set(project.id, project)
    return project
  }

  async update(project: Project): Promise<Project> {
    if (!this.projects.has(project.id)) {
      throw new Error('Project does not exist')
    }

    this.projects.set(project.id, project)
    return project
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id)
  }
}
