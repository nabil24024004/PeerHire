import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
    payment_id: string
    amount: number
    purpose: string
    metadata?: Record<string, any>
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const rupantorApiKey = Deno.env.get('RUPANTORPAY_API_KEY')!
        const rupantorBaseUrl = Deno.env.get('RUPANTORPAY_BASE_URL') || 'https://payment.rupantorpay.com'

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Verify user session
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        const body: PaymentRequest = await req.json()
        const { payment_id, amount, purpose, metadata } = body

        if (!payment_id || !amount) {
            throw new Error('Missing required fields: payment_id, amount')
        }

        // Get user profile for name/email
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        // Construct success/cancel URLs
        const appUrl = Deno.env.get('APP_URL') || 'https://peerhire.netlify.app'
        const successUrl = `${appUrl}/payment/success?transaction_id={transaction_id}`
        const cancelUrl = `${appUrl}/payment/cancel`
        const webhookUrl = `${supabaseUrl}/functions/v1/rupantor-webhook`

        // Call RupantorPay Checkout API
        const checkoutResponse = await fetch(`${rupantorBaseUrl}/api/payment/checkout`, {
            method: 'POST',
            headers: {
                'X-API-KEY': rupantorApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fullname: profile?.full_name || user.email?.split('@')[0] || 'PeerHire User',
                email: profile?.email || user.email,
                amount: amount,
                success_url: successUrl,
                cancel_url: cancelUrl,
                webhook_url: webhookUrl,
                metadata: {
                    payment_id: payment_id,
                    user_id: user.id,
                    purpose: purpose,
                    ...metadata,
                },
            }),
        })

        if (!checkoutResponse.ok) {
            const errorText = await checkoutResponse.text()
            console.error('RupantorPay error:', errorText)
            throw new Error(`RupantorPay API error: ${checkoutResponse.status}`)
        }

        const checkoutData = await checkoutResponse.json()

        // Update payment record with transaction_id and checkout URL
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                transaction_id: checkoutData.transaction_id,
                rupantor_checkout_url: checkoutData.checkout_url || checkoutData.url,
                status: 'processing',
            })
            .eq('id', payment_id)

        if (updateError) {
            console.error('Error updating payment:', updateError)
        }

        // Return checkout URL to frontend
        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: checkoutData.checkout_url || checkoutData.url,
                transaction_id: checkoutData.transaction_id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
