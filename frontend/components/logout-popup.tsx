"use client"

import { X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LogoutPopupProps {
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutPopup({ onConfirm, onCancel }: LogoutPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4 relative animate-scale-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Are you sure you want to logout?
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You'll need to sign in again to access your productivity data.
          </p>

          <div className="flex space-x-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}