import React from "react";
import Paragraph from "@/ui/Paragraph";

interface ButtonProps {
  className?: string;
  color?: "blue" | "magenta";
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({ className, color = "blue", children, onClick }) => {
  const colorClass = color === "blue" ? "button-blue" : "button-magenta";

  return (

    <button
      onClick={onClick}
      className={`rounded-full 
    flex flex-col py-3 px-4.5 items-center justify-center text-left text-xs text-white font-press-start-2p border-[2px] border-solid border-white leading-none box-border ${colorClass} ${className}`}>

      <Paragraph neon={color}>
        {children}
      </Paragraph>
    </button>
  );
};

export default Button;
