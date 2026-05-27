# LALIsta - Frontend (Next.js Web Application)
This is the user-facing web platform for **LALIsta**, a reactive price-comparison engine designed to help consumers optimize grocery shopping in Western Buenos Aires. 
Built with **Next.js (App Router)**, the application fetches real-time crowdsourced/SEPA datasets from **Supabase**, utilizes **Zustand** for lightweight global state management (shopping cart metrics and localization persistence), and deploys seamlessly on **Vercel**.

---

## Application Core Features

* **`buscar/`:** Dynamic product catalog explorer querying updated daily retail item sheets.
* **`mi-lista/`:** A reactive virtual shopping cart tracking items, quantities, and aggregated price baselines.
* **`ubicacion/`:** Regional geographical onboarding filter restricts data querying to configured hubs (`ITUZAINGO`, `MORON`, `CASTELAR`).
* **`comparativa/`:** The core business logic engine. Compares the user's active shopping cart matrix across all localized physical supermarkets to highlight the single cheapest branch.
* **`calculadora/`:** Inflation analytical tool tracking historical daily pricing shifts across standard consumer goods categories.

## Repository Structure

```text
lalista-front/
├── app/
│   ├── buscar/
│   │   └── page.tsx           # Product discovery & search result UI
│   ├── mi-lista/
│   │   └── page.tsx           # Interactive consumer shopping cart view
│   ├── ubicacion/
│   │   └── page.tsx           # Geo-location filtering interface
│   ├── comparativa/
│   │   └── page.tsx           # Bulk branch-by-branch price matrix comparison
│   ├── calculadora/
│   │   └── page.tsx           # Inflation tracking analytical dashboard
│   ├── _components/           # Reusable atomic UI blocks (Navbar, Cards, Buttons)
│   ├── _store/                # Zustand global state manager (cart & geo-context)
│   ├── _lib/                  # Supabase client SDK service configurations
│   │   └── supabase.ts
│   ├── layout.tsx             # Main application layout wrapper
│   └── page.tsx               # Landing Page / Home View
├── .env.local                 # Local environment variables (git-ignored)
└── package.json
```

## Stack & Dependencies
    Framework: Next.js 14+ (App Router Architecture)
    State Management: Zustand (Stores volatile reactive memory without context overhead)
    Backend Interface: @supabase/supabase-js (Secure Read-Only relational client)
    Deployment Platform: Vercel Hosting Suite
    
## Local Development Setup
Follow these steps to run the application sandbox in your local environment:
1. Installation
Clone this repository, navigate to the root directory, and fetch the package dependencies:
`
cd lalista-front
npm install
`
2. Environment Variables

Create a .env.local file at the root level of the project (at the same level as package.json):
`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_public_anonymous_key
`
3. Run Server
Launch the development compiler instance:
`
npm run dev
`
Once initialized, open your browser and navigate to http://localhost:3000.

## Cloud Deployment via Vercel CLI

The production staging environment is designed to sync directly into the Vercel architecture. To deploy manually via the command-line interface, execute the following actions:

  Install the global CLI packages:
    
    npm install -g vercel

  Authenticate with your hosting account: vercel login

  Link and trigger a project deployment build:
    
    vercel

Note: Ensure you mirror your .env.local parameters inside the Vercel Dashboard -> Project Settings -> Environment Variables panel so the serverless functions can map your database endpoints correctly during compile time.
