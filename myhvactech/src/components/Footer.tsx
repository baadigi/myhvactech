import Link from 'next/link'
import Logo from '@/components/Logo'
import { HVAC_SERVICES } from '@/lib/constants'
import { Twitter, Linkedin, Facebook } from 'lucide-react'

const popularCities = [
  { name: 'Phoenix', state: 'AZ', href: '/arizona/phoenix' },
  { name: 'Dallas', state: 'TX', href: '/texas/dallas' },
  { name: 'Miami', state: 'FL', href: '/florida/miami' },
  { name: 'Houston', state: 'TX', href: '/texas/houston' },
  { name: 'Chicago', state: 'IL', href: '/illinois/chicago' },
  { name: 'Los Angeles', state: 'CA', href: '/california/los-angeles' },
]

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'For Contractors', href: '/for-contractors' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const topServices = HVAC_SERVICES.slice(0, 6)

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Column 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo className="[&_span]:text-white" showText={true} />
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-xs">
              The trusted directory for commercial HVAC contractors. Find, compare, and hire
              the best heating and cooling professionals near you.
            </p>
            <p className="mt-4 text-xs text-neutral-500">
              <a
                href="https://www.perplexity.ai/computer"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-300 transition-colors underline underline-offset-2"
              >
                Created with Perplexity Computer
              </a>
            </p>
          </div>

          {/* Column 2: Directory */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Directory
            </h3>
            <ul className="space-y-2.5">
              {popularCities.map((city) => (
                <li key={city.href}>
                  <Link
                    href={city.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {city.name}, {city.state}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              {topServices.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            &copy; {currentYear} My HVAC Tech. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Twitter"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <Twitter size={16} />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <Facebook size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
