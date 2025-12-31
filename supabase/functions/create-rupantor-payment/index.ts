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

        console.log('🔍 Environment check:', {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            hasApiKey: !!rupantorApiKey,
            baseUrl: rupantorBaseUrl
        })

        // Create Supabase client with service role
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('❌ Missing authorization header')
            throw new Error('Missing authorization header')
        }

        // Verify user session
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            console.error('❌ Auth error:', authError)
            throw new Error('Unauthorized')
        }

        console.log('✅ User authenticated:', user.id)

        // Parse request body
        const body: PaymentRequest = await req.json()
        console.log('📦 INCOMING BODY:', JSON.stringify(body, null, 2))

        const { payment_id, amount, purpose, metadata } = body

        // Validate required fields
        if (!payment_id) {
            console.error('❌ Missing payment_id')
            throw new Error('Missing required field: payment_id')
        }

        if (!amount) {
            console.error('❌ Missing amount')
            throw new Error('Missing required field: amount')
        }

        console.log('✅ Request validation passed')

        // Get user profile for name/email
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        console.log('👤 Profile data:', {
            full_name: profile?.full_name || 'none',
            email: profile?.email || user.email || 'none'
        })

        // Construct success/cancel URLs
        const appUrl = Deno.env.get('APP_URL') || 'https://peerhireaaub.vercel.app'
        const successUrl = `${appUrl}/payment/success?payment_id=${payment_id}`
        const cancelUrl = `${appUrl}/payment/cancel`
        const webhookUrl = `${supabaseUrl}/functions/v1/rupantor-webhook`

        // Build RupantorPay payload
        const rupantorPayload = {
            fullname: profile?.full_name || user.email?.split('@')[0] || 'PeerHire User',
            email: profile?.email || user.email,
            amount: String(amount), // Ensure it's a string
            success_url: successUrl,
            cancel_url: cancelUrl,
            webhook_url: webhookUrl,
            metadata: {
                payment_id: payment_id,
                user_id: user.id,
                purpose: purpose,
                ...metadata,
            },
        }

        console.log('🚀 Calling RupantorPay with payload:', JSON.stringify(rupantorPayload, null, 2))

        // Call RupantorPay Checkout API
        const checkoutResponse = await fetch(`${rupantorBaseUrl}/api/payment/checkout`, {
            method: 'POST',
            headers: {
                'X-API-KEY': rupantorApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rupantorPayload),
        })

        console.log('📡 RupantorPay STATUS:', checkoutResponse.status)

        const responseText = await checkoutResponse.text()
        console.log('📡 RupantorPay RESPONSE:', responseText)

        if (!checkoutResponse.ok) {
            console.error('❌ RupantorPay error:', responseText)
            throw new Error(`RupantorPay API error: ${checkoutResponse.status} - ${responseText}`)
        }

        const checkoutData = JSON.parse(responseText)

        console.log('✅ Checkout data:', checkoutData)

        // RupantorPay returns "payment_url", not "checkout_url"
        const paymentUrl = checkoutData.payment_url || checkoutData.checkout_url || checkoutData.url

        if (!paymentUrl) {
            console.error('❌ No payment URL in response!')
            throw new Error('No payment URL returned from RupantorPay')
        }

        // Update payment record with transaction_id and checkout URL
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                transaction_id: checkoutData.transaction_id,
                rupantor_checkout_url: paymentUrl,
                status: 'processing',
            })
            .eq('id', payment_id)

        if (updateError) {
            console.error('Error updating payment:', updateError)
        }

        console.log('✅ Returning payment URL to frontend:', paymentUrl)

        // Return checkout URL to frontend
        return new Response(
            JSON.stringify({
                success: true,
                checkout_url: paymentUrl,
                transaction_id: checkoutData.transaction_id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('💥 Error occurred:', error)
        console.error('💥 Error name:', error.name)
        console.error('💥 Error message:', error.message)
        console.error('💥 Error stack:', error.stack)

        return new Response(
            JSON.stringify({
                error: error.message || 'Unknown error',
                details: error.toString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
