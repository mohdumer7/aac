import useUserAuthorised from '@/hooks/useUserAuthorised';
import Loader from '../ui/Loader';
import React from 'react'
import { redirect, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const AuthComponent = ({children, loadingState}:{children:React.ReactNode, loadingState:boolean}) => {
  const { status,authenticated } = useUserAuthorised();
  const pathName = usePathname();

  if (authenticated && pathName === "/") {
    return redirect("/dashboard");
  }


  return (
    <Loader loading={status === "loading" || loadingState}>
      {children}
    </Loader>
  );
  
}

export default AuthComponent