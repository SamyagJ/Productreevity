"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BarChart3, TrendingUp, Clock, Target, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Utility function to refresh weekly stats - can be called from other components
export const refreshWeeklyStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const getWeekStartDate = () => {
      const now = new Date()
      const sunday = new Date(now.setDate(now.getDate() - now.getDay()))
      sunday.setHours(0, 0, 0, 0)
      return sunday.toISOString().split('T')[0]
    }

    const weekStartDate = getWeekStartDate()
    const startOfWeek = new Date(weekStartDate + 'T00:00:00.000Z')
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    // Calculate current week stats manually
    
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startOfWeek.toISOString())
      .lt('start_time', endOfWeek.toISOString())
      .eq('completed', true)
    
    
    // Also check all sessions for this user to see if any exist
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Last 5 sessions for user:', allSessions)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', startOfWeek.toISOString())
      .lt('completed_at', endOfWeek.toISOString())
      .eq('status', 'completed')

    // Calculate totals
    const totalFocusTime = sessions?.filter(s => s.session_type === 'focus')
      ?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
    const totalSessions = sessions?.length || 0
    const avgSessionDuration = totalSessions > 0 && sessions ? 
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions : 0
    const totalTasksCompleted = tasks?.length || 0
    const totalPointsEarned = (sessions?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0) +
      (tasks?.reduce((sum, t) => sum + (t.points || 0), 0) || 0)

    console.log('Manual calculation:', {
      totalFocusTime,
      totalSessions,
      avgSessionDuration,
      totalTasksCompleted,
      totalPointsEarned
    })

    // Update weekly stats record with calculated values
    await supabase
      .from('weekly_stats')
      .upsert({
        user_id: user.id,
        week_start_date: weekStartDate,
        total_focus_time: totalFocusTime,
        total_sessions: totalSessions,
        average_session_duration: Math.round(avgSessionDuration),
        total_tasks_completed: totalTasksCompleted,
        total_points_earned: totalPointsEarned,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_start_date'
      })

    return true
  } catch (error) {
    console.error('Error refreshing weekly stats:', error)
    return false
  }
}

interface StatsProps {
  user: {
    totalPoints: number
    currentStreak: number
    longestStreak: number
    username?: string
  }
  onStatsRefresh?: () => void
  refreshTrigger?: number
}

export function StatsOverview({ user, onStatsRefresh, refreshTrigger }: StatsProps) {
  const [weeklyStats, setWeeklyStats] = useState({
    focusHours: 0,
    tasksCompleted: 0,
    averageSession: 0,
    productivityScore: 0,
  })

  const [dailyProgress, setDailyProgress] = useState<Array<{ day: string; hours: number; tasks: number; points: number; dailyGoal: number }>>([
    { day: "Sun", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Mon", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Tue", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Wed", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Thu", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Fri", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
    { day: "Sat", hours: 0, tasks: 0, points: 0, dailyGoal: 0 },
  ])
  
  const [weeklyGoal, setWeeklyGoal] = useState(100) // Default weekly points goal
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [newGoal, setNewGoal] = useState("")

  useEffect(() => {
    fetchWeeklyStats()
    
    // Set up interval to refresh stats every minute
    const interval = setInterval(() => {
      fetchWeeklyStats()
    }, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [])
  
  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchWeeklyStats()
    }
  }, [refreshTrigger])

  // Expose refresh function to parent component
  useEffect(() => {
    if (onStatsRefresh) {
      onStatsRefresh()
    }
  }, [onStatsRefresh])

  const fetchWeeklyStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Get current week start date (Sunday)
      const getWeekStartDate = () => {
        const now = new Date()
        const sunday = new Date(now.setDate(now.getDate() - now.getDay()))
        sunday.setHours(0, 0, 0, 0)
        return sunday.toISOString().split('T')[0] // Get just the date part
      }

      const weekStartDate = getWeekStartDate()

      // Fetch or create weekly stats record
      let { data: weeklyStatsData } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('week_start_date', weekStartDate)
        .single()

      // If no weekly stats exist, create one
      if (!weeklyStatsData) {
        const { data: newStats } = await supabase
          .from('weekly_stats')
          .insert({
            user_id: authUser.id,
            week_start_date: weekStartDate
          })
          .select('*')
          .single()
        weeklyStatsData = newStats
      }

      // Fetch weekly goal
      let { data: weeklyGoalData } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('week_start_date', weekStartDate)
        .single()

      // If no goal exists, create default
      if (!weeklyGoalData) {
        const { data: newGoal } = await supabase
          .from('weekly_goals')
          .insert({
            user_id: authUser.id,
            week_start_date: weekStartDate,
            points_goal: weeklyGoal
          })
          .select('*')
          .single()
        weeklyGoalData = newGoal
      } else {
        setWeeklyGoal(weeklyGoalData.points_goal)
      }

      // Calculate weekly stats from the aggregated data
      if (weeklyStatsData) {
        console.log('Weekly stats data from DB:', weeklyStatsData)
        const focusHours = Math.round((weeklyStatsData.total_focus_time / 3600) * 100) / 100
        const avgSessionMinutes = Math.round((weeklyStatsData.average_session_duration / 60) * 100) / 100
        const productivityScore = weeklyGoalData && weeklyGoalData.points_goal > 0 ? 
          Math.round((weeklyStatsData.total_points_earned / weeklyGoalData.points_goal) * 100) : 0
        
        console.log('Calculated stats:', { focusHours, avgSessionMinutes, productivityScore })

        setWeeklyStats({
          focusHours,
          tasksCompleted: weeklyStatsData.total_tasks_completed,
          averageSession: avgSessionMinutes,
          productivityScore,
        })
      }

      // Fetch daily progress data
      const startOfWeek = new Date(weekStartDate + 'T00:00:00.000Z')
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      // Fetch sessions for daily breakdown
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', authUser.id)
        .gte('start_time', startOfWeek.toISOString())
        .lt('start_time', endOfWeek.toISOString())
        .eq('completed', true)
        .eq('session_type', 'focus')

      // Fetch tasks for daily breakdown
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', authUser.id)
        .gte('completed_at', startOfWeek.toISOString())
        .lt('completed_at', endOfWeek.toISOString())
        .eq('status', 'completed')

      // Calculate daily goals
      const goalPoints = weeklyGoalData?.points_goal || weeklyGoal
      const baseDaily = Math.floor(goalPoints / 7)
      const remainder = goalPoints % 7
      const dailyGoals = [
        baseDaily, // Sun
        baseDaily, // Mon
        baseDaily, // Tue 
        baseDaily, // Wed
        baseDaily, // Thu
        baseDaily, // Fri
        baseDaily + remainder, // Sat (gets the remainder)
      ]

      // Calculate daily progress
      const dailyData = new Map<number, { hours: number; tasks: number; points: number; dailyGoal: number }>()
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      // Initialize daily data with goals
      for (let i = 0; i < 7; i++) {
        dailyData.set(i, { hours: 0, tasks: 0, points: 0, dailyGoal: dailyGoals[i] })
      }

      // Aggregate session hours by day
      sessions?.forEach(session => {
        const date = new Date(session.start_time)
        const dayOfWeek = date.getDay()
        const current = dailyData.get(dayOfWeek) || { hours: 0, tasks: 0, points: 0, dailyGoal: dailyGoals[dayOfWeek] }
        current.hours += (session.duration || 0) / 3600
        current.points += session.points_earned || 0
        dailyData.set(dayOfWeek, current)
      })

      // Aggregate tasks by day
      tasks?.forEach(task => {
        const date = new Date(task.completed_at)
        const dayOfWeek = date.getDay()
        const current = dailyData.get(dayOfWeek) || { hours: 0, tasks: 0, points: 0, dailyGoal: dailyGoals[dayOfWeek] }
        current.tasks += 1
        current.points += task.points || 0
        dailyData.set(dayOfWeek, current)
      })

      // Convert to array format starting with Sunday
      const progressArray = Array.from(dailyData.entries()).map(([day, data]) => ({
        day: dayNames[day],
        hours: Math.round(data.hours * 10) / 10,
        tasks: data.tasks,
        points: data.points,
        dailyGoal: data.dailyGoal,
      }))

      // Keep original order (Sunday first)
      const sundayFirst = [
        progressArray[0], // Sun
        progressArray[1], // Mon
        progressArray[2], // Tue
        progressArray[3], // Wed
        progressArray[4], // Thu
        progressArray[5], // Fri
        progressArray[6], // Sat
      ]

      setDailyProgress(sundayFirst)
    } catch (error) {
      console.error('Error fetching weekly stats:', error)
    }
  }

  const saveGoal = async () => {
    const goal = parseInt(newGoal)
    console.log('saveGoal called with:', { newGoal, goal })
    
    if (!isNaN(goal) && goal > 0) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          console.error('No authenticated user found')
          return
        }

        const getWeekStartDate = () => {
          const now = new Date()
          const sunday = new Date(now.setDate(now.getDate() - now.getDay()))
          sunday.setHours(0, 0, 0, 0)
          return sunday.toISOString().split('T')[0]
        }

        const weekStartDate = getWeekStartDate()
        console.log('Saving goal:', { user_id: authUser.id, week_start_date: weekStartDate, points_goal: goal })

        // Update or insert weekly goal
        const { data, error } = await supabase
          .from('weekly_goals')
          .upsert({
            user_id: authUser.id,
            week_start_date: weekStartDate,
            points_goal: goal,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,week_start_date'
          })
          .select()

        if (error) {
          console.error('Error saving weekly goal:', error)
          console.error('Error details:', error.message, error.details, error.hint)
          return
        }

        console.log('Goal saved successfully:', data)
        setWeeklyGoal(goal)
        setShowGoalDialog(false)
        setNewGoal("")
        
        // Refresh stats to update productivity score
        await fetchWeeklyStats()
      } catch (error) {
        console.error('Error saving goal:', error)
      }
    } else {
      console.log('Invalid goal value:', { newGoal, goal })
    }
  }

  return (
    <>
      {/* Goal Setting Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Weekly Points Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="weekly-goal">Weekly Points Target</Label>
              <Input
                id="weekly-goal"
                type="number"
                placeholder="Enter your weekly points goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will be distributed across the week ({Math.round(parseInt(newGoal || "0") / 7)} points per day)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveGoal} disabled={!newGoal || parseInt(newGoal) <= 0}>
              Save Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>Weekly Overview</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewGoal(weeklyGoal.toString())
              setShowGoalDialog(true)
            }}
          >
            <Settings className="h-4 w-4 mr-1" />
            Goal: {weeklyGoal}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{weeklyStats.focusHours.toFixed(2)}h</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Focus Time</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{weeklyStats.tasksCompleted}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Done</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{weeklyStats.averageSession.toFixed(2)}m</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Session</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{weeklyStats.productivityScore}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
          </div>
        </div>

        {/* Daily Progress Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Daily Progress</h4>
          <div className="space-y-3">
            {dailyProgress.map((day) => (
              <div key={day.day} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">{day.day}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{day.points}/{day.dailyGoal} points</span>
                    <span>{day.tasks} tasks</span>
                  </div>
                  <Progress value={Math.min(100, day.dailyGoal > 0 ? (day.points / day.dailyGoal) * 100 : 0)} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Progress */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Streak Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Streak</span>
              <span className="font-medium">{user.currentStreak} days</span>
            </div>
            <Progress value={user.longestStreak > 0 ? (user.currentStreak / user.longestStreak) * 100 : 0} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Personal Best: {user.longestStreak} days</span>
              <span>{user.longestStreak > 0 ? Math.round((user.currentStreak / user.longestStreak) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
