import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
})

// Use service role for webhook handler (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        // Map Stripe price ID to tier
        // TODO: Look up tier from subscription_plans table by stripe_price_id_monthly/annual
        const tier = priceId ? await getTierFromPriceId(supabase, priceId) : 'bronze'

        await supabase
          .from('contractors')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_tier: tier,
            subscription_status: subscription.status,
          })
          .eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from('contractors')
        .update({ subscription_status: 'active' })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from('contractors')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from('contractors')
        .update({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          is_featured: false,
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price.id
      const tier = priceId ? await getTierFromPriceId(supabase, priceId) : 'free'

      await supabase
        .from('contractors')
        .update({
          subscription_tier: tier,
          subscription_status: subscription.status,
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTierFromPriceId(
  supabase: any,
  priceId: string
): Promise<string> {
  const { data } = await supabase
    .from('subscription_plans')
    .select('slug')
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`)
    .single()

  return data?.slug || 'free'
}
