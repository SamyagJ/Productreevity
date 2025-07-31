"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Target, Flame, Clock, TreePine } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
}

interface AchievementPanelProps {
  refreshTrigger?: number
}

export function AchievementPanel({ refreshTrigger }: AchievementPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  // Helper function to calculate tree level
  const calculateTreeLevel = (treeData: any) => {
    if (!treeData) return 0
    if (treeData.diamond_apples > 0) return 4
    if (treeData.gold_apples > 0) return 3
    if (treeData.silver_apples > 0) return 2
    if (treeData.red_apples > 0) return 1
    return 0
  }

  useEffect(() => {
    fetchAchievements()
  }, [refreshTrigger])

  // Subscribe to tree updates for real-time achievement progress
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('tree-achievement-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'trees',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Refresh achievements when tree data changes
            fetchAchievements()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupSubscription()
  }, [])

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('name')

      if (achievementsError) throw achievementsError

      // Fetch user's unlocked achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)

      if (userAchievementsError) throw userAchievementsError

      // Fetch user stats for progress calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, current_streak, longest_streak')
        .eq('id', user.id)
        .single()

      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const { count: sessionsCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .eq('session_type', 'focus')

      const { data: tree } = await supabase
        .from('trees')
        .select('growth_level, total_apples, red_apples, silver_apples, gold_apples, diamond_apples')
        .eq('user_id', user.id)
        .single()

      // Calculate total focus hours
      const { data: totalFocusTime } = await supabase
        .from('sessions')
        .select('duration')
        .eq('user_id', user.id)
        .eq('session_type', 'focus')
        .eq('completed', true)

      const totalFocusHours = totalFocusTime?.reduce((sum, session) => sum + (session.duration || 0), 0) / 3600 || 0

      // Check for daily task completions (for Quick Start)
      const today = new Date().toISOString().split('T')[0]
      const { data: todayStats } = await supabase
        .from('daily_stats')
        .select('tasks_completed')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      // Check for longest session (for Marathon Mind)
      const { data: longestSession } = await supabase
        .from('sessions')
        .select('duration')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('duration', { ascending: false })
        .limit(1)
        .single()

      const longestSessionHours = (longestSession?.duration || 0) / 3600

      // Map achievements with user progress
      const userAchievementMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua]) || []
      )

      const formattedAchievements = allAchievements?.map(achievement => {
        const userAchievement = userAchievementMap.get(achievement.id)
        const isUnlocked = !!userAchievement

        // Calculate progress based on achievement type
        let progress = 0
        let maxProgress = 0

        if (!isUnlocked) {
          switch (achievement.special_condition) {
            case 'tasks_10':
              progress = tasksCount || 0
              maxProgress = 10
              break
            case 'tasks_100':
              progress = tasksCount || 0
              maxProgress = 100
              break
            case 'streak_7':
              progress = profile?.current_streak || 0
              maxProgress = 7
              break
            case 'streak_30':
              progress = profile?.current_streak || 0
              maxProgress = 30
              break
            case 'sessions_100':
              progress = sessionsCount || 0
              maxProgress = 100
              break
            case 'tree_level_3':
              progress = calculateTreeLevel(tree)
              maxProgress = 3
              break
            case 'tree_level_4':
              progress = calculateTreeLevel(tree)
              maxProgress = 4
              break
            case 'apples_100':
              // Calculate total apples from total points (10 points = 1 apple)
              progress = Math.floor((profile?.total_points || 0) / 10)
              maxProgress = 100
              break
            case 'hours_100':
              progress = Math.floor(totalFocusHours)
              maxProgress = 100
              break
            case 'tasks_5_day':
              progress = todayStats?.tasks_completed || 0
              maxProgress = 5
              break
            case 'session_120':
              progress = Math.min(120, Math.floor(longestSessionHours * 60))
              maxProgress = 120
              break
            case 'gold_apple':
            case 'diamond_apple':
            case 'first_session':
            case 'early_bird':
            case 'night_owl':
            case 'daily_week':
            case 'perfect_week':
              // These are instant unlock achievements, no progress to show
              break
            default:
              if (achievement.points_required) {
                progress = profile?.total_points || 0
                maxProgress = achievement.points_required
              }
          }
        }

        // Get icon based on achievement name
        let icon = <Trophy className="h-4 w-4" />
        if (achievement.name.toLowerCase().includes('task')) {
          icon = <Target className="h-4 w-4" />
        } else if (achievement.name.toLowerCase().includes('streak') || achievement.name.toLowerCase().includes('warrior')) {
          icon = <Flame className="h-4 w-4" />
        } else if (achievement.name.toLowerCase().includes('time') || achievement.name.toLowerCase().includes('focus')) {
          icon = <Clock className="h-4 w-4" />
        } else if (achievement.name.toLowerCase().includes('tree')) {
          icon = <TreePine className="h-4 w-4" />
        } else if (achievement.name.toLowerCase().includes('first')) {
          icon = <Star className="h-4 w-4" />
        }

        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon,
          unlocked: isUnlocked,
          unlockedAt: userAchievement?.unlocked_at ? new Date(userAchievement.unlocked_at) : undefined,
          progress: !isUnlocked && maxProgress > 0 ? Math.min(progress, maxProgress) : undefined,
          maxProgress: !isUnlocked && maxProgress > 0 ? maxProgress : undefined
        }
      }) || []

      setAchievements(formattedAchievements)
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading achievements...</p>
      </div>
    )
  }

  const placeholderAchievements: Achievement[] = [
    {
      id: "1",
      name: "First Steps",
      description: "Complete your first focus session",
      icon: <Star className="h-4 w-4" />,
      unlocked: true,
      unlockedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Streak Master",
      description: "Maintain a 7-day productivity streak",
      icon: <Flame className="h-4 w-4" />,
      unlocked: true,
      unlockedAt: new Date("2024-01-20"),
    },
    {
      id: "3",
      name: "Task Crusher",
      description: "Complete 25 tasks",
      icon: <Target className="h-4 w-4" />,
      unlocked: false,
      progress: 18,
      maxProgress: 25,
    },
    {
      id: "4",
      name: "Time Master",
      description: "Accumulate 50 hours of focus time",
      icon: <Clock className="h-4 w-4" />,
      unlocked: false,
      progress: 32,
      maxProgress: 50,
    },
    {
      id: "5",
      name: "Tree Whisperer",
      description: "Grow your tree to level 25",
      icon: <TreePine className="h-4 w-4" />,
      unlocked: false,
      progress: 15,
      maxProgress: 25,
    },
    {
      id: "6",
      name: "Golden Apple",
      description: "Earn your first gold apple",
      icon: <Trophy className="h-4 w-4" />,
      unlocked: true,
      unlockedAt: new Date("2024-01-22"),
    },
  ]

  // Use real achievements if available, otherwise use placeholders
  const displayAchievements = achievements.length > 0 ? achievements : placeholderAchievements

  const recentAchievements = displayAchievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
    .slice(0, 3)

  const inProgressAchievements = displayAchievements.filter((a) => !a.unlocked && a.progress !== undefined).slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Recent Achievements */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Unlocked</h4>
        <div className="space-y-2">
          {recentAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center space-x-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{achievement.name}</p>
                <p className="text-xs text-gray-600 truncate">{achievement.description}</p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Unlocked
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* In Progress */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">In Progress</h4>
        <div className="space-y-2">
          {inProgressAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center space-x-3 p-2 bg-gray-50 border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{achievement.name}</p>
                <p className="text-xs text-gray-600 truncate">{achievement.description}</p>
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <div className="mt-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                      <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="pt-2 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-yellow-600">{displayAchievements.filter((a) => a.unlocked).length}</p>
            <p className="text-xs text-gray-600">Unlocked</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-600">{displayAchievements.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}
