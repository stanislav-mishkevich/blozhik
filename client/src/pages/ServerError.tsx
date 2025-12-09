import ErrorPage from '../components/ErrorPage';

export default function ServerError() {
  return (
    <ErrorPage 
      code={500} 
      title="Server Error"
      message="Something went wrong on our end. Our team has been notified!"
    />
  );
}
