import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
    transaction_id: string
    status: string
    amount?: number
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

        // RupantorPay sends form data, not JSON!
        const contentType = req.headers.get('content-type') || ''
        console.log('📨 Content-Type:', contentType)

        let payload: any = {}

        if (contentType.includes('application/x-www-form-urlencoded')) {
            // Parse form data
            const formData = await req.formData()
            console.log('📋 Form data entries:')
            for (const [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`)
                payload[key] = value
            }
        } else {
            // Try JSON as fallback
            payload = await req.json()
        }

        console.log('🔔 Webhook FULL PAYLOAD:', JSON.stringify(payload, null, 2))
        console.log('🔔 Payload keys:', Object.keys(payload))

        const transaction_id = payload.transaction_id || payload.transactionId || payload.txnid || payload.tx_id
        const status = payload.status
        const metadata = payload.metadata

        // Log what we extracted
        console.log('📝 Extracted values:', {
            transaction_id,
            status,
            metadata_exists: !!metadata
        })

        if (!transaction_id) {
            console.error('❌ Missing transaction_id in webhook payload')
            console.error('❌ Available keys:', Object.keys(payload))
            throw new Error('Missing transaction_id in webhook payload')
        }

        // VERIFY payment with RupantorPay API (CRITICAL - never trust webhook alone)
        const verifyResponse = await fetch(`${rupantorBaseUrl}/api/payment/verify-payment`, {
            method: 'POST',
            headers: {
                'X-API-KEY': rupantorApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ transaction_id }),
        })

        if (!verifyResponse.ok) {
            console.error('Verification failed:', await verifyResponse.text())
            throw new Error('Payment verification failed')
        }

        const verifyData = await verifyResponse.json()
        console.log('✅ Verification result:', verifyData)

        // Parse metadata (RupantorPay returns it as a JSON string)
        let parsedMetadata: any = {}
        if (verifyData.metadata) {
            try {
                parsedMetadata = typeof verifyData.metadata === 'string'
                    ? JSON.parse(verifyData.metadata)
                    : verifyData.metadata
                console.log('📦 Parsed metadata:', parsedMetadata)
            } catch (e) {
                console.error('Failed to parse metadata:', e)
            }
        }

        // Determine payment status from verification
        const isPaymentSuccessful = verifyData.status === 'success' ||
            verifyData.status === 'paid' ||
            verifyData.status === 'completed' ||
            verifyData.status === 'COMPLETED'

        console.log('💰 Payment successful?', isPaymentSuccessful)

        // Get payment record using payment_id from metadata
        const paymentId = parsedMetadata.payment_id

        if (!paymentId) {
            console.error('❌ No payment_id in metadata!')
            throw new Error('Payment ID not found in metadata')
        }

        console.log('🔍 Looking for payment with ID:', paymentId)

        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single()

        if (paymentError || !payment) {
            console.error('❌ Payment not found:', paymentError)
            throw new Error('Payment record not found')
        }

        console.log('✅ Found payment:', payment.id)

        // IDEMPOTENCY: Don't process if already paid
        if (payment.status === 'paid') {
            console.log('⚠️ Payment already processed (idempotent - ignoring duplicate webhook)');
            return new Response(
                JSON.stringify({ success: true, status: 'paid', message: 'Already processed' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        if (isPaymentSuccessful) {
            // Update payment status to paid
            await supabase
                .from('payments')
                .update({
                    status: 'paid',
                    transaction_id: transaction_id  // Store transaction_id now
                })
                .eq('id', payment.id)

            // Create the job from stored metadata
            const jobData = payment.metadata?.jobData
            if (jobData) {
                const { error: jobError } = await supabase
                    .from('jobs')
                    .insert({
                        title: jobData.title,
                        description: jobData.description,
                        category: jobData.category,
                        deadline: jobData.deadline,
                        budget: jobData.budget,
                        hirer_id: payment.user_id,
                        attachment_urls: jobData.attachment_urls,
                    })
                    .select()
                    .single()

                if (jobError) {
                    console.error('Error creating job:', jobError)
                } else if (job) {
                    console.log('Job created successfully:', job.id)
                    // Link job_id to payment
                    await supabase
                        .from('payments')
                        .update({ job_id: job.id })
                        .eq('id', payment.id)
                }

                if (jobError) {
                    console.error('Error creating job:', jobError)
                } else {
                    console.log('Job created successfully for payment:', payment.id)
                }
            }

            // Create notification for user
            await supabase.from('notifications').insert({
                user_id: payment.user_id,
                title: 'Payment Successful',
                message: `Your payment of ৳${payment.amount} was successful. Your job has been posted!`,
                type: 'payment',
            })

        } else {
            // Payment failed
            await supabase
                .from('payments')
                .update({ status: 'failed' })
                .eq('id', payment.id)

            // Notify user of failure
            await supabase.from('notifications').insert({
                user_id: payment.user_id,
                title: 'Payment Failed',
                message: 'Your payment could not be processed. Please try again.',
                type: 'payment',
            })
        }

        return new Response(
            JSON.stringify({ success: true, status: isPaymentSuccessful ? 'paid' : 'failed' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
