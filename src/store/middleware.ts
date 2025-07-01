import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { Middleware } from '@reduxjs/toolkit'
import { toast } from 'react-toastify' // Assuming you use react-toastify

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  // if (isRejectedWithValue(action)) {
  //   // Log error to your preferred logging service
  //   console.error('API Error:', action.payload)
    
  //   // Show user-friendly error message
  //   toast.error(
  //     //@ts-ignore
  //     action.payload.data?.message || 'An error occurred. Please try again.'
  //   )
  // }

  return next(action)
} 