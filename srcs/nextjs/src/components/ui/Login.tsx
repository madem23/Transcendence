import Form from './Form';

interface LoginFormProps {
  onSubmit: (form: HTMLFormElement) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {


  return (
    <main className="flex flex-col items-center gap-5">
        <p className="text-center font mx-auto w-25">
        To sign in please enter your email and password
      </p>
      { }
      <Form onSubmit={onSubmit} size="small">
      </Form>
    </main>
  );
};

export default LoginForm;
