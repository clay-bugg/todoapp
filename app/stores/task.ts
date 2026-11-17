
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Task } from '../types/task'
import type { CreateTaskInput } from '../services/taskService'

import { TaskService } from '../services/taskService'
import { InMemoryTaskRepository } from '../repositories/taskRepository'

export const useTaskStore = defineStore('tasks', () => {
  // Dependencies
  const repository = new InMemoryTaskRepository()
  const service = new TaskService(repository)

  // State
  const tasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all tasks
  async function fetchTasks(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      tasks.value = await service.getTasks()
    } catch (err) {
      error.value = err instanceof Error
        ? err.message
        : 'Failed to fetch tasks'

      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create a task
  async function addTask(input: CreateTaskInput): Promise<Task> {
    const task = await service.createTask(input)

    tasks.value.push(task)

    return task
  }

  // Update a task
  async function updateTask(
    id: string,
    changes: Partial<Pick<
      Task,
      'title' | 'description' | 'completed' | 'priority' | 'dueDate' | 'projectId'
    >>
  ): Promise<void> {
    await service.updateTask(id, changes)

    // Refresh because moving a parent can also update its descendants.
    tasks.value = await service.getTasks()
  }

  // Delete a task
  async function deleteTask(id: string): Promise<void> {
    await service.deleteTask(id)

    // Refresh because deleting a parent also deletes its descendants.
    tasks.value = await service.getTasks()
  }

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask
  }
})
