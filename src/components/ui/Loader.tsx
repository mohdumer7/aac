import { Loader2 } from 'lucide-react';
import React from 'react'

const Loader = ({ loading, children }: { loading: boolean, children: React.ReactNode }) => {
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center absolute top-0 left-0 bg-neutral-900/50 z-50">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
  return <>{children}</>;
};

export default Loader;
