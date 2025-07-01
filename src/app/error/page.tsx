"use client"
import { Suspense } from "react"

export default function AuthErrorPage() {
  return (
    <Suspense>

      <div className="flex h-screen w-full flex-col items-center justify-center">
        <a
          href="#"
          className="block max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 flex flex-row items-center justify-center gap-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Access Denied !
          </h5>
          <div className="font-normal text-gray-700 dark:text-gray-400">
            Something Went Worng! 
          </div>
          <br />
          <div className="font-normal text-gray-700 dark:text-gray-400">
            Please contact the admin to get access.
          </div>
        </a>
      </div>
    </Suspense>
  )
}