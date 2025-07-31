"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  points: number
  createdAt: Date
}

interface TaskManagerProps {
  onTaskComplete?: (points: number) => void
}

export function TaskManager({ onTaskComplete }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [todayStats, setTodayStats] = useState({ points_earned: 0, tasks_completed: 0 })

  useEffect(() => {
    fetchTasks()
    fetchTodayStats()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedTasks = data.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.status === 'completed',
          priority: task.priority as 'low' | 'medium' | 'high',
          points: task.points,
          createdAt: new Date(task.created_at),
        }))
        setTasks(formattedTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_stats')
        .select('points_earned, tasks_completed')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found" error

      if (data) {
        setTodayStats(data)
      }
    } catch (error) {
      console.error('Error fetching today stats:', error)
    }
  }

  const addTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              username: user.email?.split('@')[0] || 'user'
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
            alert('Error creating user profile. Please try again.')
            return
          }

          // Also create tree record
          await supabase
            .from('trees')
            .insert({
              user_id: user.id
            })
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            status: 'pending'
          })
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          alert(`Error adding task: ${error.message}`)
          return
        }

        if (data) {
          const newTask: Task = {
            id: data.id,
            title: data.title,
            completed: false,
            priority: data.priority as 'low' | 'medium' | 'high',
            points: data.points,
            createdAt: new Date(data.created_at),
          }
          setTasks([newTask, ...tasks])
          setNewTaskTitle("")
          setNewTaskPriority('medium')
          setIsAddDialogOpen(false)
        }
      } catch (error) {
        console.error('Error adding task:', error)
      }
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newCompleted = !task.completed

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('tasks')
        .update({
          status: newCompleted ? 'completed' : 'pending',
          completed_at: newCompleted ? new Date().toISOString() : null
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const updatedTasks = tasks.map((t) => {
        if (t.id === id) {
          if (newCompleted && onTaskComplete) {
            onTaskComplete(t.points)
          }
          return { ...t, completed: newCompleted }
        }
        return t
      })
      setTasks(updatedTasks)
      
      // Refresh today's stats
      fetchTodayStats()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setTasks(tasks.filter((task) => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return "bg-red-500"
      case 'medium':
        return "bg-yellow-500"
      case 'low':
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const updateTaskPriority = async (id: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const pointsMap = {
        'low': 1,
        'medium': 5,
        'high': 10
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          priority: newPriority,
          points: pointsMap[newPriority]
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setTasks(
        tasks.map((task) => (task.id === id ? { ...task, priority: newPriority, points: pointsMap[newPriority] } : task))
      )
    } catch (error) {
      console.error('Error updating task priority:', error)
    }
  }

  // Use daily stats for display
  const completedTasks = todayStats.tasks_completed
  const totalPoints = todayStats.points_earned

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add Task Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <p className="text-lg font-bold text-green-600">
                {completedTasks}
              </p>
              <p className="text-xs text-gray-600">Completed Today</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{totalPoints}</p>
              <p className="text-xs text-gray-600">Points Today</p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={() => setIsAddDialogOpen(true)} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-1" />
        Add Task
      </Button>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Name</Label>
              <Input
                id="task-title"
                placeholder="Enter task name..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority Level</Label>
              <Select
                value={newTaskPriority}
                onValueChange={(value) => setNewTaskPriority(value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      High Priority (10 points)
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                      Medium Priority (5 points)
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      Low Priority (1 point)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTask} disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
              task.completed
                ? "bg-green-50 border-green-200 opacity-75"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  task.completed ? "line-through text-gray-500" : "text-gray-900"
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Select
                  value={task.priority}
                  onValueChange={(value) => updateTaskPriority(task.id, value as 'low' | 'medium' | 'high')}
                  disabled={task.completed}
                >
                  <SelectTrigger
                    className={`w-20 h-6 text-xs ${getPriorityColor(task.priority)} text-white border-none`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {task.points} pts
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No tasks yet. Add one above to get started!</p>
        </div>
      )}
    </div>
  )
}