// Input component extends from shadcnui - https://ui.shadcn.com/docs/components/input
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "framer-motion";
import { Search } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const radius = 100; // change this to increase the rdaius of the hover effect
    const [visible, setVisible] = React.useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      let { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
    return (

      <motion.div
        style={{
          width: "100%",
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
          var(--blue-500),
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="p-[1px] rounded-lg transition duration-300 group/input"
      >
        <div
          className={cn(
            `flex gap-2 items-center h-[35px] w-full border-2 border-gray-300 bg-white dark:bg-zinc-800 
     text-black dark:text-white rounded-md px-2 text-sm 
     focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-neutral-600
     transition duration-300`
          )}
        >
          
          {/* <Search size={17} className="text-gray-400" /> */}
          <input
            type={type}
            className={cn(
              `flex-1 bg-transparent outline-none placeholder:text-neutral-400 
       dark:placeholder:text-neutral-600 dark:text-white text-black`,
              className
            )}
            ref={ref}
            {...props}
          />
        </div>



      </motion.div>
    );
  }
);
Input.displayName = "Input";

export { Input };
