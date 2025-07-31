"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Clock } from "lucide-react"

interface TimePickerProps {
  defaultHours: number
  defaultMinutes: number
  onConfirm: (hours: number, minutes: number) => void
  onCancel: () => void
  isOpen: boolean
}

export function TimePicker({ defaultHours, defaultMinutes, onConfirm, onCancel, isOpen }: TimePickerProps) {
  const [selectedHours, setSelectedHours] = useState(defaultHours)
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes)
  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  useEffect(() => {
    if (isOpen) {
      setSelectedHours(defaultHours)
      setSelectedMinutes(defaultMinutes)
      
      // Scroll to default values after component mounts
      setTimeout(() => {
        if (hoursRef.current) {
          const hourElement = hoursRef.current.children[defaultHours] as HTMLElement
          if (hourElement) {
            hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
        if (minutesRef.current) {
          const minuteElement = minutesRef.current.children[defaultMinutes] as HTMLElement
          if (minuteElement) {
            minuteElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 100)
    }
  }, [isOpen, defaultHours, defaultMinutes])

  const handleConfirm = () => {
    if (selectedHours === 0 && selectedMinutes === 0) {
      // Don't allow 0:00
      return
    }
    onConfirm(selectedHours, selectedMinutes)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Set Focus Time
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-6">
            {/* Hours Picker */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hours
              </label>
              <div 
                ref={hoursRef}
                className="h-32 overflow-y-auto scroll-smooth border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={`px-4 py-2 cursor-pointer text-center transition-colors ${
                      selectedHours === hour
                        ? 'bg-green-500 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedHours(hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">:</div>

            {/* Minutes Picker */}
            <div className="flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minutes
              </label>
              <div 
                ref={minutesRef}
                className="h-32 overflow-y-auto scroll-smooth border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    className={`px-4 py-2 cursor-pointer text-center transition-colors ${
                      selectedMinutes === minute
                        ? 'bg-green-500 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedMinutes(minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedHours.toString().padStart(2, '0')}:
              {selectedMinutes.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total: {selectedHours * 60 + selectedMinutes} minutes
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={handleConfirm}
              disabled={selectedHours === 0 && selectedMinutes === 0}
            >
              Set Time
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}