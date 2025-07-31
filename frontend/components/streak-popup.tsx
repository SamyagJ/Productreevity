"use client"

import { useState, useEffect } from "react"
import { X, Flame } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface StreakPopupProps {
  userId: string
  currentStreak: number
  onClose: () => void
}

export function StreakPopup({ userId, currentStreak, onClose }: StreakPopupProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = async () => {
    // Update the database to mark popup as shown today
    await supabase
      .from('profiles')
      .update({ streak_popup_shown_date: new Date().toISOString().split('T')[0] })
      .eq('id', userId)
    
    setIsVisible(false)
    onClose()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center animate-bounce">
              <Flame className="h-10 w-10 text-orange-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Great Job Getting Today's Streak!
          </h2>
          
          <p className="text-lg text-gray-600 mb-4">
            You're on a <span className="font-bold text-orange-500">{currentStreak} day</span> streak!
          </p>

          <p className="text-sm text-gray-500">
            Keep it up! Complete at least 25 minutes of focus time tomorrow to continue your streak.
          </p>
        </div>
      </div>
    </div>
  )
}