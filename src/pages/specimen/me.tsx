import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function MySpecimenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      router.replace(`/specimen/${session.user.id}`);
    } else if (status === 'unauthenticated') {
      router.replace('/api/auth/signin');
    }
  }, [session, status, router]);

  return <div className="min-h-screen flex items-center justify-center text-2xl">Redirecting...</div>;
} 