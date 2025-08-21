import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found • SpecimenStats</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 404 Icon */}
            <div className="text-8xl font-bold text-blue-600">404</div>
            
            {/* Message */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Page Not Found
              </h1>
              <p className="text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2 px-4 transition-colors"
              >
                <Search className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
