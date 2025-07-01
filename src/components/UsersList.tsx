import React from 'react'
import { useGetUsersQuery } from '../services/endpoints/usersApi'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Loader2 } from 'lucide-react'

export const UsersList: React.FC = () => {
  const {
    data: users,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUsersQuery(undefined, {
    // Configure polling if needed
    pollingInterval: 0,
    // Refetch when window regains focus
    refetchOnFocus: true,
    // Refetch when coming back online
    refetchOnReconnect: true,
  })

  if (isLoading) {
    return <Loader2 className="animate-spin"/>
  }

  if (isError) {
    return (
      <ErrorMessage
        //@ts-ignore
        message={error.message || 'Failed to load users'}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="users-grid">
      {users?.map((user) => (
        <p>{user.fullName}</p>
      ))}
    </div>
  )
}
