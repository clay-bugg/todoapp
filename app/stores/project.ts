
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Project } from '../types/project'
import type { CreateProjectInput } from '../services/projectService'

import { ProjectService } from '../services/projectService'
import { InMemoryProjectRepository } from '../repositories/projectRepository'

import { useTaskStore } from './task'
import { TaskService } from '../services/taskService'
import { InMemoryTaskRepository } from '../repositories/taskRepository'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const taskStore = useTaskStore()

  // Use the task store's service indirectly through its actions for now.
  // Project deletion is coordinated in the store.
  const repository = new InMemoryProjectRepository()

  async function fetchProjects(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      projects.value = await repository.getAll()
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to fetch projects'

      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addProject(input: CreateProjectInput): Promise<Project> {
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

    await repository.create(project)
    projects.value.push(project)

    return project
  }

  async function updateProject(
    id: string,
    changes: Partial<Pick<
      Project,
      'name' | 'description' | 'icon' | 'color'
    >>
  ): Promise<void> {
    const existing = projects.value.find(project => project.id === id)

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

    await repository.update(updated)

    projects.value = projects.value.map(project =>
      project.id === id ? updated : project
    )
  }

  async function deleteProject(id: string): Promise<void> {
    const project = projects.value.find(project => project.id === id)

    if (!project) {
      throw new Error('Project does not exist')
    }

    const projectTasks = taskStore.tasks.filter(
      task => task.projectId === id && task.parentTaskId === null
    )

    for (const task of projectTasks) {
      await taskStore.deleteTask(task.id)
    }

    await repository.delete(id)

    projects.value = projects.value.filter(project => project.id !== id)
  }

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject
  }
})
