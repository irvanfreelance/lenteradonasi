# Product Requirements Document (PRD)
**Project Name:** Public Donation Portal (White-Label SaaS)
**Target Audience:** Public Donors, Affiliates/Fundraisers
**Objective:** Deliver an ultra-fast, SEO-optimized, and high-conversion public-facing donation web application with zero perceived loading time and enterprise-grade high-traffic resilience.

## 1. Product Vision
To provide a seamless, instantaneous donation experience that maximizes conversion rates. The platform must handle sudden viral traffic spikes (e.g., flash donations, disaster relief) without performance degradation, utilizing edge caching and background synchronization.

## 2. Core User Personas
1. **The Public Donor:** Wants to quickly browse campaigns, read updates, and donate using modern payment methods (QRIS, E-Wallets, VA) with minimal friction.
2. **The Affiliate/Fundraiser:** Wants to share custom tracking links to campaigns and view their impact/commission.

## 3. Key Features & Scope
### 3.1. Campaign Discovery (Ultra-Fast)
* **Dynamic Homepage:** Banners, Urgent Campaigns, and Category filtering.
* **Zero-Loading Experience:** Pre-rendered pages using Next.js ISR (Incremental Static Regeneration) or aggressive SSR caching. 

### 3.2. Campaign Details & Variations
* **Standard Campaigns:** Open donations with or without targets/time limits.
* **Zakat Calculator:** Interactive calculator for Zakat Maal/Profesi.
* **Qurban Variants:** Fixed-price variants with strict real-time stock limits (e.g., 1/7 Cow, 1 Goat).
* **Bundling:** Fixed-price packages containing multiple campaign items (e.g., Ramadhan Bundle).

### 3.3. Seamless Checkout & Payment
* **Guest & Authenticated Checkout:** Minimize steps to pay.
* **Payment Methods:** Integration with Xendit/Midtrans for VA, E-Wallets, and QRIS.
* **QRIS Static Offline-to-Online:** Support for displaying static QRIS where payments automatically update the web UI via webhooks.

### 3.4. Marketing & Affiliate Engine
* **Affiliate Tracking:** Capture `affiliate_code` from URL parameters and attribute transactions.
* **Multi-Channel Pixel:** Server-Side tracking (Meta CAPI, TikTok Events API) triggered purely on the backend to bypass ad-blockers.

## 4. Success Metrics
* **LCP (Largest Contentful Paint):** < 1.2 seconds.
* **Uptime:** 99.99% during traffic spikes (Flash Sale resilience).
* **Checkout Abandonment Rate:** < 20%.