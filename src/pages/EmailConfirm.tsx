import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const EmailConfirm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                // Supabase automatically handles the email confirmation via the URL hash
                // We just need to check if the user is authenticated
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session) {
                    setStatus('success');
                    setMessage('Your email has been confirmed successfully!');

                    // Wait 2 seconds then redirect to appropriate dashboard
                    setTimeout(async () => {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('is_hirer, is_freelancer')
                            .eq('id', session.user.id)
                            .single();

                        const activeRole = localStorage.getItem('activeRole') || (profile?.is_hirer ? 'hirer' : 'freelancer');
                        navigate(activeRole === 'freelancer' ? '/freelancer/dashboard' : '/hirer/dashboard');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage('Email confirmation failed. Please try again or contact support.');
                }
            } catch (error: any) {
                console.error('Email confirmation error:', error);
                setStatus('error');
                setMessage(error.message || 'Something went wrong. Please try again.');
            }
        };

        confirmEmail();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="max-w-md w-full p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                        <h1 className="text-2xl font-bold mb-2">Confirming your email...</h1>
                        <p className="text-muted-foreground">Please wait while we verify your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
                        <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                        <h1 className="text-2xl font-bold mb-2">Confirmation Failed</h1>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => navigate('/signup')}>
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/')}>
                                Go Home
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default EmailConfirm;
