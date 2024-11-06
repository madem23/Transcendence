import React, { FC, FormEvent, ReactNode } from 'react';
import Button from '@/ui/Button';
import { cva } from 'class-variance-authority';

export const formVariants = cva(
  'w-64 h-10 py-2 px-4',
  {
    variants: {
      size: {
        default: 'h-10 py-2 px-4',
        medium: 'h-8 py-2 px-3',
        small: 'h-7 py-1 px-2',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  size?: 'default' | 'medium' | 'small';
  children?: ReactNode;
  buttonName?: string;
}

const Form: FC<FormProps> = ({ onSubmit, isLoading, size = 'default', children, buttonName="Submit" }) => {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(e.target as HTMLFormElement);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-64 flex flex-col gap-4">
      {children}
      <input type="text" placeholder="Email" name="username" className="font-press-start-2p px-4 py-1 w-full rounded" />
      <input type="password" placeholder="Password" name="password" className="font-press-start-2p px-4 py-1 w-full rounded" />

      <Button>{buttonName}</Button>
    </form>
  );
};

export default Form;
