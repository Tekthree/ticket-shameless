export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        <a 
          href="/"
          className="inline-block px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
