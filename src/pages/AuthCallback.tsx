import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Check for error in URL query params (OAuth error from Supabase)
                const urlParams = new URLSearchParams(window.location.search);
                const errorCode = urlParams.get('error_code');
                const errorDescription = urlParams.get('error_description');

                if (errorCode || errorDescription) {
                    throw new Error(`${errorCode}: ${errorDescription}`);
                }

                // Get the session from the URL hash (OAuth returns tokens here)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (session) {
                    // Ensure profile exists
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, is_hirer, is_freelancer')
                        .eq('id', session.user.id)
                        .single();

                    // Create profile if it doesn't exist
                    if (profileError || !profile) {
                        await supabase.from('profiles').upsert({
                            id: session.user.id,
                            email: session.user.email,
                            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
                            is_hirer: true,
                            is_freelancer: true,
                        });
                    }

                    // Set default role
                    localStorage.setItem('activeRole', 'hirer');

                    // Redirect to dashboard
                    navigate('/hirer/dashboard', { replace: true });
                } else {
                    // No session, try to exchange the code
                    // This happens when the OAuth flow returns with a code in the URL
                    const hashParams = new URLSearchParams(window.location.hash.substring(1));
                    const accessToken = hashParams.get('access_token');

                    if (accessToken) {
                        // Wait for Supabase to process the tokens
                        const { data: { session: newSession } } = await supabase.auth.getSession();
                        if (newSession) {
                            localStorage.setItem('activeRole', 'hirer');
                            navigate('/hirer/dashboard', { replace: true });
                            return;
                        }
                    }

                    // If still no session, redirect to login
                    setError('Authentication failed. Please try again.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || 'Authentication failed');
                setTimeout(() => navigate('/login'), 5000);
            }
        };

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                localStorage.setItem('activeRole', 'hirer');
                navigate('/hirer/dashboard', { replace: true });
            }
        });

        handleAuthCallback();

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                {error ? (
                    <>
                        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                            <span className="text-destructive text-xl">!</span>
                        </div>
                        <p className="text-destructive">{error}</p>
                        <p className="text-muted-foreground text-sm">Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                            <div className="w-6 h-6 rounded-full bg-primary animate-spin" style={{
                                borderRadius: '50%',
                                border: '3px solid transparent',
                                borderTopColor: 'hsl(var(--primary))',
                            }} />
                        </div>
                        <p className="text-foreground font-medium">Signing you in...</p>
                        <p className="text-muted-foreground text-sm">Please wait</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
