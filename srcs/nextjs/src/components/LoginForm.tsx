// components/ui/LoginForm.tsx
import React, { useState } from 'react';
import Form from '@/ui/Form';
import Paragraph from './ui/Paragraph';
interface LoginFormProps {
  onSubmit: (form: HTMLFormElement) => Promise<void>;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading }) => {
  return (
    <main className="flex flex-col items-center">
      <Paragraph className="mt-4 mx-auto w-64 text-center mb-4">
        To sign in please enter your email and password
      </Paragraph>
      <Form onSubmit={onSubmit} isLoading={isLoading} size="small">
      </Form>
    </main>
  );
};

export default LoginForm;
