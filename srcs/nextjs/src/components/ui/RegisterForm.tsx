import React from 'react';
import Form from './Form';
import { useRouter } from 'next/router';

interface RegisterFormProps {
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit }) => {
  const router = useRouter();

  const handleSubmit = async (form: HTMLFormElement) => {
    await onSubmit(form);
  };

  return (
    <main className="flex flex-col items-center gap-5">
      <p className="text-center font mx-auto">
        To register please enter an email and password
      </p>
      <Form onSubmit={handleSubmit} size="small">
      </Form>
    </main>
  );
};

export default RegisterForm;
