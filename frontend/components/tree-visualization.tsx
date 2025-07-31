"use client"

import { useEffect, useState } from "react"

interface TreeProps {
  tree: {
    growthLevel: number
    totalApples: number
    bronzeApples: number
    silverApples: number
    goldApples: number
    diamondApples: number
  }
}

export function TreeVisualization({ tree }: TreeProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(tree.growthLevel)
    }, 500)
    return () => clearTimeout(timer)
  }, [tree.growthLevel])

  const getTreeSize = (level: number) => {
    if (level <= 20) return { size: "small", height: "h-32", width: "w-24" }
    if (level <= 50) return { size: "medium", height: "h-40", width: "w-32" }
    if (level <= 80) return { size: "large", height: "h-48", width: "w-40" }
    return { size: "grand", height: "h-56", width: "w-48" }
  }

  const treeSize = getTreeSize(animatedLevel)

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-green-100 rounded-lg"></div>

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-300 to-green-200 rounded-b-lg"></div>

      {/* Tree Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Tree Crown */}
        <div className={`relative ${treeSize.height} ${treeSize.width} transition-all duration-1000 ease-out`}>
          {/* Tree Foliage */}
          <div className="absolute inset-0">
            {/* Main foliage layers */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-green-500 rounded-full opacity-90"></div>
            {animatedLevel > 10 && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 -translate-x-4 w-16 h-16 bg-green-600 rounded-full opacity-80"></div>
            )}
            {animatedLevel > 20 && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 translate-x-4 w-16 h-16 bg-green-600 rounded-full opacity-80"></div>
            )}
            {animatedLevel > 30 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-green-400 rounded-full opacity-70"></div>
            )}
            {animatedLevel > 50 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-28 h-28 bg-green-500 rounded-full opacity-60"></div>
            )}
          </div>

          {/* Apples */}
          <div className="absolute inset-0">
            {/* Bronze Apples */}
            {Array.from({ length: Math.min(tree.bronzeApples, 8) }).map((_, i) => (
              <div
                key={`bronze-${i}`}
                className="absolute w-3 h-3 bg-amber-600 rounded-full animate-bounce"
                style={{
                  left: `${20 + (i % 4) * 15}%`,
                  top: `${40 + Math.floor(i / 4) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "2s",
                }}
              />
            ))}

            {/* Silver Apples */}
            {Array.from({ length: Math.min(tree.silverApples, 6) }).map((_, i) => (
              <div
                key={`silver-${i}`}
                className="absolute w-3 h-3 bg-gray-400 rounded-full animate-bounce"
                style={{
                  left: `${30 + (i % 3) * 20}%`,
                  top: `${30 + Math.floor(i / 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: "2.5s",
                }}
              />
            ))}

            {/* Gold Apples */}
            {Array.from({ length: Math.min(tree.goldApples, 4) }).map((_, i) => (
              <div
                key={`gold-${i}`}
                className="absolute w-4 h-4 bg-yellow-500 rounded-full animate-bounce shadow-lg"
                style={{
                  left: `${25 + (i % 2) * 30}%`,
                  top: `${20 + Math.floor(i / 2) * 30}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: "3s",
                }}
              />
            ))}

            {/* Diamond Apples */}
            {Array.from({ length: Math.min(tree.diamondApples, 2) }).map((_, i) => (
              <div
                key={`diamond-${i}`}
                className="absolute w-4 h-4 bg-blue-500 rounded-full animate-bounce shadow-xl"
                style={{
                  left: `${35 + i * 20}%`,
                  top: `${15 + i * 20}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: "3.5s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Tree Trunk */}
        <div className="w-4 h-12 bg-amber-800 rounded-t-sm transition-all duration-1000"></div>
      </div>

      {/* Growth Progress */}
      <div className="relative z-10 mt-4 w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Growth Level</span>
          <span>{animatedLevel}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${animatedLevel}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
