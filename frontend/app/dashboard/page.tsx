"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TreePine, Trophy, Target, Clock, LogOut, Settings } from "lucide-react"
import { RealisticTreeVisualization } from "@/components/realistic-tree-visualization"
import { TimerComponent } from "@/components/timer-component"
import { TaskManager } from "@/components/task-manager"
import { AchievementPanel } from "@/components/achievement-panel"
import { StatsOverview, refreshWeeklyStats } from "@/components/stats-overview"
import { StreakPopup } from "@/components/streak-popup"
import { LogoutPopup } from "@/components/logout-popup"
import { SettingsPopup } from "@/components/settings-popup"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [user, setUser] = useState({
    username: "",
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
  })

  const [tree, setTree] = useState({
    growthLevel: 1,
    totalApples: 0,
    redApples: 0,
    silverApples: 0,
    goldApples: 0,
    diamondApples: 0,
  })

  const [loading, setLoading] = useState(true)
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLogoutPopup, setShowLogoutPopup] = useState(false)
  const [showSettingsPopup, setShowSettingsPopup] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [achievementRefreshTrigger, setAchievementRefreshTrigger] = useState(0)
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchUserData()
    updateUserTimezone()
  }, [])

  // Auto-detect and update user's timezone
  const updateUserTimezone = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Check if timezone is already set
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', authUser.id)
        .single()

      // Update timezone if not set or different
      if (!profile?.timezone || profile.timezone !== userTimezone) {
        await supabase
          .from('profiles')
          .update({ timezone: userTimezone })
          .eq('id', authUser.id)
      }
    } catch (error) {
      // Silently handle timezone update errors
    }
  }

  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // Fetch user tree
      const { data: treeData } = await supabase
        .from('trees')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (profile) {
        setUserId(authUser.id)
        const userTotalPoints = profile.total_points || 0
        
        setUser({
          username: profile.username,
          totalPoints: userTotalPoints,
          currentStreak: profile.current_streak || 0,
          longestStreak: profile.longest_streak || 0,
        })
        
        // Check if we should show streak popup
        // Show if: user has a streak, earned points today, and hasn't seen popup today
        const today = new Date().toISOString().split('T')[0]
        const lastPointEarnedToday = profile.last_point_earned_date === today
        const popupNotShownToday = profile.streak_popup_shown_date !== today
        
        if (profile.current_streak > 0 && lastPointEarnedToday && popupNotShownToday) {
          setShowStreakPopup(true)
        }
        
        // Calculate apples from total points - use database value
        const totalRedApples = Math.floor(userTotalPoints / 10)
        const diamondApples = Math.floor(totalRedApples / 125)
        const remainingAfterDiamond = totalRedApples - (diamondApples * 125)
        const goldApples = Math.floor(remainingAfterDiamond / 25)
        const remainingAfterGold = remainingAfterDiamond - (goldApples * 25)
        const silverApples = Math.floor(remainingAfterGold / 5)
        const redApples = remainingAfterGold % 5 // Remainder after silver conversion
        
        
        
        setTree({
          growthLevel: treeData?.growth_level || 1,
          totalApples: totalRedApples,
          redApples: redApples,
          silverApples: silverApples,
          goldApples: goldApples,
          diamondApples: diamondApples,
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Subscribe to real-time updates for user points
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const channel = supabase
        .channel('profile-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${authUser.id}`,
          },
          (payload) => {
            // Update user points when database changes
            if (payload.new) {
              const prevStreak = user.currentStreak
              const newStreak = payload.new.current_streak || 0
              const newTotalPoints = payload.new.total_points || 0
              
              setUser(prev => ({
                ...prev,
                totalPoints: newTotalPoints,
                currentStreak: newStreak,
                longestStreak: payload.new.longest_streak || 0,
              }))
              
              // Recalculate apples when points change
              const totalRedApples = Math.floor(newTotalPoints / 10)
              const diamondApples = Math.floor(totalRedApples / 125)
              const remainingAfterDiamond = totalRedApples - (diamondApples * 125)
              const goldApples = Math.floor(remainingAfterDiamond / 25)
              const remainingAfterGold = remainingAfterDiamond - (goldApples * 25)
              const silverApples = Math.floor(remainingAfterGold / 5)
              const redApples = remainingAfterGold % 5
              
              setTree(prev => ({
                ...prev,
                totalApples: totalRedApples,
                redApples: redApples,
                silverApples: silverApples,
                goldApples: goldApples,
                diamondApples: diamondApples,
              }))
              
              // Check if we should show streak popup
              const today = new Date().toISOString().split('T')[0]
              const lastPointEarnedToday = payload.new.last_point_earned_date === today
              const popupNotShownToday = payload.new.streak_popup_shown_date !== today
              
              // Show popup if streak increased and conditions are met
              if (newStreak > prevStreak && lastPointEarnedToday && popupNotShownToday) {
                setShowStreakPopup(true)
              }
              
              // Refresh weekly stats when points change
              if (newTotalPoints !== user.totalPoints) {
                refreshWeeklyStats()
                setStatsRefreshTrigger(prev => prev + 1)
              }
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupSubscription()
  }, [])

  // Function to handle session completion and update tree
  const handleSessionComplete = async (session: any) => {

    // 25-minute focus session = 1 point
    const pointsEarned = Math.floor(session.duration / (25 * 60)) // 1 point per 25 minutes
    const newTotalPoints = user.totalPoints + pointsEarned

    // Convert points to apples (10 points = 1 red apple)
    const convertPointsToApples = (totalPoints: number) => {
      const totalRedApples = Math.floor(totalPoints / 10)
      const totalApples = totalRedApples
      
      // Calculate how many of each type we should have
      const diamondApples = Math.floor(totalRedApples / 125) // 5^3 = 125 red apples per diamond
      const remainingAfterDiamond = totalRedApples - (diamondApples * 125)
      
      const goldApples = Math.floor(remainingAfterDiamond / 25) // 5^2 = 25 red apples per gold
      const remainingAfterGold = remainingAfterDiamond - (goldApples * 25)
      
      const silverApples = Math.floor(remainingAfterGold / 5) // 5 red apples per silver
      const redApples = remainingAfterGold % 5
      
      return {
        red: redApples,
        silver: silverApples,
        gold: goldApples,
        diamond: diamondApples,
        total: totalApples
      }
    }

    const newApples = convertPointsToApples(newTotalPoints)
    // totalApples should be the total count in red apple equivalents
    const totalApples = Math.floor(newTotalPoints / 10)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Update user points in database and get updated profile with streak info
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ total_points: newTotalPoints })
          .eq('id', authUser.id)
          .select('current_streak, longest_streak')
          .single()

        // Update tree in database
        await supabase
          .from('trees')
          .update({
            total_apples: totalApples,
            red_apples: newApples.red,
            silver_apples: newApples.silver,
            gold_apples: newApples.gold,
            diamond_apples: newApples.diamond,
            growth_level: Math.min(100, tree.growthLevel + Math.floor(pointsEarned / 5))
          })
          .eq('user_id', authUser.id)
          
        // Update local state with new streak info
        if (updatedProfile) {
          setUser((prev) => ({ 
            ...prev, 
            totalPoints: newTotalPoints,
            currentStreak: updatedProfile.current_streak || 0,
            longestStreak: updatedProfile.longest_streak || 0
          }))
        } else {
          setUser((prev) => ({ ...prev, totalPoints: newTotalPoints }))
        }
      } else {
        // Update local state
        setUser((prev) => ({ ...prev, totalPoints: newTotalPoints }))
      }
      setTree(prev => ({
        ...prev,
        totalApples: totalApples,
        redApples: newApples.red,
        silverApples: newApples.silver,
        goldApples: newApples.gold,
        diamondApples: newApples.diamond,
        growthLevel: Math.min(100, prev.growthLevel + Math.floor(pointsEarned / 5))
      }))
      
      // Trigger achievement refresh
      setAchievementRefreshTrigger(prev => prev + 1)
      
      // Refresh weekly stats after session complete
      await refreshWeeklyStats()
      setStatsRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error updating session data:', error)
    }
  }

  // Function to handle task completion
  const handleTaskComplete = async (taskPoints: number) => {
    const newTotalPoints = user.totalPoints + taskPoints

    // Convert points to apples using same logic as sessions
    const convertPointsToApples = (totalPoints: number) => {
      const totalRedApples = Math.floor(totalPoints / 10)
      const totalApples = totalRedApples
      
      // Calculate how many of each type we should have
      const diamondApples = Math.floor(totalRedApples / 125) // 5^3 = 125 red apples per diamond
      const remainingAfterDiamond = totalRedApples - (diamondApples * 125)
      
      const goldApples = Math.floor(remainingAfterDiamond / 25) // 5^2 = 25 red apples per gold
      const remainingAfterGold = remainingAfterDiamond - (goldApples * 25)
      
      const silverApples = Math.floor(remainingAfterGold / 5) // 5 red apples per silver
      const redApples = remainingAfterGold % 5
      
      return {
        red: redApples,
        silver: silverApples,
        gold: goldApples,
        diamond: diamondApples,
        total: totalApples
      }
    }

    const newApples = convertPointsToApples(newTotalPoints)
    // totalApples should be the total count in red apple equivalents
    const totalApples = Math.floor(newTotalPoints / 10)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        // Update user points in database and get updated profile with streak info
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ total_points: newTotalPoints })
          .eq('id', authUser.id)
          .select('current_streak, longest_streak')
          .single()

        // Update tree in database
        await supabase
          .from('trees')
          .update({
            total_apples: totalApples,
            red_apples: newApples.red,
            silver_apples: newApples.silver,
            gold_apples: newApples.gold,
            diamond_apples: newApples.diamond,
            growth_level: Math.min(100, tree.growthLevel + Math.floor(taskPoints / 5))
          })
          .eq('user_id', authUser.id)
          
        // Update local state with new streak info
        if (updatedProfile) {
          setUser((prev) => ({ 
            ...prev, 
            totalPoints: newTotalPoints,
            currentStreak: updatedProfile.current_streak || 0,
            longestStreak: updatedProfile.longest_streak || 0
          }))
        } else {
          setUser((prev) => ({ ...prev, totalPoints: newTotalPoints }))
        }
      } else {
        // Update local state
        setUser((prev) => ({ ...prev, totalPoints: newTotalPoints }))
      }
      setTree(prev => ({
        ...prev,
        totalApples: totalApples,
        redApples: newApples.red,
        silverApples: newApples.silver,
        goldApples: newApples.gold,
        diamondApples: newApples.diamond,
        growthLevel: Math.min(100, prev.growthLevel + Math.floor(taskPoints / 5))
      }))
      
      // Trigger achievement refresh
      setAchievementRefreshTrigger(prev => prev + 1)
      
      // Refresh weekly stats after task complete
      await refreshWeeklyStats()
      setStatsRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error updating task completion data:', error)
    }
  }

  // Calculate tree level based on apple tiers
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error logging out:', error)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const calculateTreeLevel = () => {
    if (tree.diamondApples > 0) return 4 // Diamond present (highest)
    if (tree.goldApples > 0) return 3    // Gold present  
    if (tree.silverApples > 0) return 2  // Silver present
    if (tree.redApples > 0) return 1     // Red present
    return 0 // Sapling (no apples)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <TreePine className="h-12 w-12 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your productivity tree...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-green-50 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettingsPopup(true)}
                  className="text-gray-600 hover:text-gray-900 p-1.5 sm:p-2"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoutPopup(true)}
                  className="text-gray-600 hover:text-red-600 hover:border-red-200 p-1.5 sm:p-2"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <TreePine className="h-5 w-5 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Productreevity</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">Welcome back, {user.username}!</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-center sm:text-right flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Points</p>
                <p className="text-base sm:text-xl font-bold text-green-600">{user.totalPoints.toLocaleString()}</p>
              </div>
              <div className="text-center sm:text-right flex-1 sm:flex-initial">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Current Streak</p>
                <p className="text-base sm:text-xl font-bold text-orange-600">{user.currentStreak} days</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left Column - Tree & Timer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tree Visualization */}
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-white">
                  <TreePine className="h-5 w-5 text-green-600" />
                  <span>Your Productivity Tree</span>
                  <Badge variant="secondary">Level {calculateTreeLevel()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RealisticTreeVisualization tree={tree} onTreeUpdate={setTree} />

                {/* Apple Collection Stats */}
                <div className="p-3 sm:p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    <div className="text-center px-1">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-1 sm:mb-2 shadow-lg"></div>
                      <p className="text-xs sm:text-sm font-medium">Red</p>
                      <p className="text-sm sm:text-lg font-bold text-red-600">{tree.redApples}</p>
                    </div>
                    <div className="text-center px-1">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full mx-auto mb-1 sm:mb-2 shadow-lg"></div>
                      <p className="text-xs sm:text-sm font-medium">Silver</p>
                      <p className="text-sm sm:text-lg font-bold text-gray-600">{tree.silverApples}</p>
                    </div>
                    <div className="text-center px-1">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full mx-auto mb-1 sm:mb-2 shadow-lg"></div>
                      <p className="text-xs sm:text-sm font-medium">Gold</p>
                      <p className="text-sm sm:text-lg font-bold text-yellow-600">{tree.goldApples}</p>
                    </div>
                    <div className="text-center px-1">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-300 to-blue-600 rounded-full mx-auto mb-1 sm:mb-2 shadow-lg"></div>
                      <p className="text-xs sm:text-sm font-medium">Diamond</p>
                      <p className="text-sm sm:text-lg font-bold text-blue-600">{tree.diamondApples}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timer Section */}
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-white">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Focus Timer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimerComponent onSessionComplete={handleSessionComplete} />
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <StatsOverview user={user} refreshTrigger={statsRefreshTrigger} />
          </div>

          {/* Right Column - Tasks & Achievements */}
          <div className="space-y-6">
            {/* Task Manager */}
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-white">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Today's Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskManager onTaskComplete={handleTaskComplete} />
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-white">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementPanel refreshTrigger={achievementRefreshTrigger} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Popups */}
      {showStreakPopup && (
        <StreakPopup
          userId={userId}
          currentStreak={user.currentStreak}
          onClose={() => setShowStreakPopup(false)}
        />
      )}
      
      {showLogoutPopup && (
        <LogoutPopup
          onConfirm={() => {
            setShowLogoutPopup(false)
            handleLogout()
          }}
          onCancel={() => setShowLogoutPopup(false)}
        />
      )}
      
      {showSettingsPopup && (
        <SettingsPopup
          userId={userId}
          onClose={() => setShowSettingsPopup(false)}
        />
      )}
    </div>
  )
}
