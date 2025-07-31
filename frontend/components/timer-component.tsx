"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { refreshWeeklyStats } from "./stats-overview"

interface TimerProps {
  onSessionComplete: (session: any) => void
}

export function TimerComponent({ onSessionComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [sessionType, setSessionType] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [completedSessions, setCompletedSessions] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // Track elapsed time for current session
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const sessionDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }

  // Load today's session count on component mount
  useEffect(() => {
    loadTodaysSessionCount()
    setupMidnightReset()
  }, [])

  // Existing timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(async () => {
        setElapsedTime(prev => prev + 1)
        
        // Only track elapsed time for focus sessions
        // Break sessions run purely locally
        
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, sessionType])

  const updateUserFocusTime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Note: In a real app, you might want to batch these updates or use a different approach
      // to avoid too many database calls. For now, this gives real-time tracking.
    } catch (error) {
      // Silently handle error
    }
  }

  const loadTodaysSessionCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
      
      const { data, error } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('start_time', todayStart)
        .lt('start_time', todayEnd)

      if (error) {
        return
      }

      setCompletedSessions(data?.length || 0)
    } catch (error) {
    }
  }

  const setupMidnightReset = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0) // Set to midnight

    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // Set timeout to reset at midnight
    const midnightTimeout = setTimeout(() => {
      setCompletedSessions(0)
      
      // Set up daily interval to reset every day at midnight
      setInterval(() => {
        setCompletedSessions(0)
        }, 24 * 60 * 60 * 1000) // 24 hours
    }, msUntilMidnight)

    return () => clearTimeout(midnightTimeout)
  }

  const saveSessionToDatabase = async (sessionData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Debug removed("ERROR: No user found")
        return
      }

      // Validate required data
      if (!sessionStartTime) {
        // Debug removed("ERROR: No session start time")
        return
      }

      if (elapsedTime <= 0) {
        // Debug removed("ERROR: No elapsed time to save")
        return
      }

      const sessionRecord = {
        user_id: user.id,
        start_time: sessionStartTime.toISOString(),
        end_time: new Date().toISOString(),
        duration: elapsedTime,
        session_type: sessionType === 'shortBreak' ? 'break' : sessionType === 'longBreak' ? 'longbreak' : sessionType,
        completed: true,
        points_earned: 0  // Points now calculated automatically by database trigger
      }

      // Use RPC call to handle potential week boundary splitting
      const { error } = await supabase.rpc('split_session_at_week_boundary', {
        p_user_id: user.id,
        p_start_time: sessionStartTime.toISOString(),
        p_end_time: new Date().toISOString(),
        p_session_type: sessionType === 'shortBreak' ? 'break' : sessionType === 'longBreak' ? 'longbreak' : sessionType,
        p_total_duration: elapsedTime
      })

      if (error) {
        console.error('Error saving session:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        console.error('Session data being saved:', {
          p_user_id: user.id,
          p_start_time: sessionStartTime.toISOString(),
          p_end_time: new Date().toISOString(),
          p_session_type: sessionType === 'shortBreak' ? 'break' : sessionType === 'longBreak' ? 'longbreak' : sessionType,
          p_total_duration: elapsedTime
        })
      } else {
      }
    } catch (error) {
      // Handle error silently
    }
  }

  const handleSessionComplete = async () => {
    // Debug removed("Session completing...")
    setIsRunning(false)

    const session = {
      type: sessionType,
      duration: elapsedTime,
      completedAt: new Date(),
      points: 0,  // Points calculated automatically by database trigger
    }

    // Only save focus sessions to database, breaks run locally only
    if (sessionType === "focus") {
      await saveSessionToDatabase(session)
      await refreshWeeklyStats()
      // Only increment counter for focus sessions
      setCompletedSessions((prev) => prev + 1)
    } else {
      // Debug removed(`${sessionType} completed locally (not saved to database)`)
    }

    onSessionComplete(session)

    if (sessionType === "focus") {
      // Auto-switch to break
      if ((completedSessions + 1) % 4 === 0) {
        setSessionType("longBreak")
        setTimeLeft(sessionDurations.longBreak)
      } else {
        setSessionType("shortBreak")
        setTimeLeft(sessionDurations.shortBreak)
      }
    } else {
      // Switch back to focus
      setSessionType("focus")
      setTimeLeft(sessionDurations.focus)
    }
    
    // Reset elapsed time for next session
    setElapsedTime(0)
    setSessionStartTime(null)
  }

  const calculatePoints = () => {
    // Points are now calculated automatically by database trigger
    // This is just for UI display - shows 0 since points are awarded based on total time, not per session
    return 0
  }

  const toggleTimer = () => {
    if (!isRunning) {
      // Starting timer
      setSessionStartTime(new Date())
      setElapsedTime(0)
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = async () => {
    // Debug removed(`Timer reset clicked... Running: ${isRunning}, Elapsed: ${elapsedTime}s`)
    // If any time has elapsed, save partial session (only for focus sessions)
    if (elapsedTime > 0) {
      if (sessionType === "focus") {
        // Debug removed("Saving partial focus session...")
        const partialSession = {
          type: sessionType,
          duration: elapsedTime,
          completedAt: new Date(),
          points: 0,  // Points calculated automatically by database trigger
        }
        
        await saveSessionToDatabase(partialSession)
        await refreshWeeklyStats()
        onSessionComplete(partialSession)
        
        // Increment sessions counter for partial focus sessions
        setCompletedSessions((prev) => prev + 1)
      } else {
        // Debug removed(`${sessionType} reset locally (not saved to database)`)
      }
    } else {
      // Debug removed(`No session to save - Elapsed: ${elapsedTime}s (no time elapsed)`)
    }
    
    setIsRunning(false)
    setTimeLeft(sessionDurations[sessionType])
    setElapsedTime(0)
    setSessionStartTime(null)
  }

  const switchSession = (type: "focus" | "shortBreak" | "longBreak") => {
    setIsRunning(false)
    setSessionType(type)
    setTimeLeft(sessionDurations[type])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSessionColor = () => {
    switch (sessionType) {
      case "focus":
        return "bg-green-500"
      case "shortBreak":
        return "bg-blue-500"
      case "longBreak":
        return "bg-purple-500"
    }
  }

  const progress = ((sessionDurations[sessionType] - timeLeft) / sessionDurations[sessionType]) * 100

  return (
    <div className="space-y-6">
      {/* Session Type Selector */}
      <div className="flex space-x-2">
        <Button
          variant={sessionType === "focus" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSession("focus")}
          className={sessionType === "focus" ? "bg-green-600" : ""}
        >
          Focus
        </Button>
        <Button
          variant={sessionType === "shortBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSession("shortBreak")}
          className={sessionType === "shortBreak" ? "bg-blue-600" : ""}
        >
          Short Break
        </Button>
        <Button
          variant={sessionType === "longBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchSession("longBreak")}
          className={sessionType === "longBreak" ? "bg-purple-600" : ""}
        >
          Long Break
        </Button>
      </div>

      {/* Timer Display */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              {sessionType === "focus" ? "Focus Session" : sessionType === "shortBreak" ? "Short Break" : "Long Break"}
            </Badge>
          </div>

          {/* Circular Progress */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ${
                  sessionType === "focus"
                    ? "text-green-500"
                    : sessionType === "shortBreak"
                      ? "text-blue-500"
                      : "text-purple-500"
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button onClick={toggleTimer} size="lg" className={`${getSessionColor()} hover:opacity-90`}>
              {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedSessions}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Focus Sessions Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.floor(elapsedTime / 60)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Minutes This Session</p>
          </CardContent>
        </Card>
      </div>
      
    </div>
  )
}
