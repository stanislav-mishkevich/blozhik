import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  code?: number;
  title?: string;
  message?: string;
}

const jokes = [
  "Looks like this page went to buy milk and never came back 🥛",
  "Error 404: Your page is in another castle 🏰",
  "This page is on vacation in the Bahamas 🏖️",
  "Houston, we have a problem... we can't find this page 🚀",
  "This page has left the building 🎸",
  "Oops! This page took a wrong turn at Albuquerque 🌵",
  "The page you're looking for is playing hide and seek 🙈",
  "This page went out for coffee and never returned ☕",
  "Error: Page not found. But hey, at least you found this cool GIF! 🎉",
  "This page is off the grid, living its best life 🏕️",
  "404: The page you seek has achieved enlightenment and left this realm 🧘",
  "This page is currently stuck in the Matrix 🕶️",
  "Plot twist: This page never existed 🎬",
  "This page is taking a mental health day 🧠",
  "Error: Page is currently busy being awesome elsewhere ✨"
];

const getRandomJoke = () => jokes[Math.floor(Math.random() * jokes.length)];

export default function ErrorPage({ code = 404, title, message }: ErrorPageProps) {
  const [, setLocation] = useLocation();
  const joke = getRandomJoke();
  
  const defaultTitles: Record<number, string> = {
    404: "Page Not Found",
    403: "Access Denied",
    500: "Server Error",
    503: "Service Unavailable",
  };

  const displayTitle = title || defaultTitles[code] || "Something Went Wrong";
  const displayMessage = message || "Don't worry, it happens to the best of us!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-4 border-black dark:border-white sketch-shadow p-8 md:p-12">
          {/* Error Code */}
          <div className="text-center mb-6">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 animate-pulse">
              {code}
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-black text-center text-black dark:text-white mb-4">
            {displayTitle}
          </h2>

          {/* Joke */}
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-6">
            <p className="text-lg text-center text-gray-800 dark:text-gray-200 font-bold">
              {joke}
            </p>
          </div>

          {/* Message */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {displayMessage}
          </p>

          {/* GIF */}
          <div className="mb-8 rounded-lg overflow-hidden border-4 border-black dark:border-white">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-auto"
            >
              <source src="/animation.gif.mp4" type="video/mp4" />
              {/* Fallback for browsers that don't support video */}
              <div className="w-full h-64 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
                <span className="text-4xl">🎭</span>
              </div>
            </video>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.history.back()}
              className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => setLocation('/')}
              className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 font-bold sketch-shadow"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>

        {/* Footer Easter Egg */}
        <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Error ID: <span className="font-mono">{Math.random().toString(36).substring(7).toUpperCase()}</span>
          {' '}• Time: <span className="font-mono">{new Date().toLocaleTimeString()}</span>
        </p>
      </div>
    </div>
  );
}
