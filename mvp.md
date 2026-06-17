Act as a principal full-stack engineer, geospatial app architect, and TypeScript product builder.

Build a production-grade MVP web app called **MapFactbook**.

## Product concept
MapFactbook is a modern economic intelligence platform centered on a beautiful interactive world map. It should feel premium, dark-themed, serious, and analyst-friendly.

Important:
- Build **everything in this prompt only**.
- Exclude news completely.
- Do not ask clarifying questions.
- Make sensible assumptions and continue.
- Prefer working implementation over long explanations.

## Tech stack
Use:
- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- MapLibre GL JS
- Recharts
- Framer Motion
- Prisma + SQLite
- Zod
- date-fns

## MVP scope

### 1. Global homepage map
Create a dark premium homepage with:
- interactive world map
- zoom/pan
- hover states
- click-to-open country drawer/panel
- search bar
- metric selector
- year selector
- region filter
- responsive side panel layout

### 2. Country overview panel
When a country is clicked, show:
- name
- flag
- capital
- region
- population
- GDP
- GDP per capita
- inflation
- unemployment
- currency
- exchange rate
- exports
- imports
- debt-to-GDP
- policy rate
- credit rating
- latest year
- source metadata
- missing-data notice

### 3. Country profile page
Create country pages with these tabs:
- Overview
- Economy
- Trade
- Demographics
- Labor
- Government Finance
- Monetary & Currency
- Energy & Sustainability
- Risk
- Methodology / Sources

Each tab should be real and functional using mock/sample data.

### 4. Time series basics
Support time-series charts for core metrics:
- GDP
- GDP per capita
- inflation
- unemployment
- population
- exchange rate
- debt-to-GDP

### 5. Compare mode
Allow comparing 2–4 countries side-by-side with:
- KPI cards
- line charts
- bar charts
- radar chart
- normalized comparison option

### 6. Rankings view
Create sortable/filterable rankings for:
- GDP
- GDP per capita
- inflation
- unemployment
- population
- exports
- imports
- debt-to-GDP
- growth

### 7. Indicator library
Create a library with categories:
- Macroeconomy
- Trade
- Labor
- Public Finance
- Monetary & Currency
- Demographics
- Energy
- Sustainability
- Risk

Each indicator needs:
- name
- definition
- unit
- category
- latest year
- source
- notes

### 8. Save/export basics
Support:
- save countries to watchlist
- save compare sets
- export tables as CSV
- export chart images
- shareable URLs for filters

### 9. Data transparency
Every metric/chart must show:
- source label
- date/year
- actual vs estimate tag
- missing-data handling
- methodology note placeholder

## Architecture requirements
Build with:
- feature-based folders
- strong TypeScript typing
- reusable chart components
- reusable table components
- reusable map layer components
- Zod schemas for domain entities
- service/adapters so real data providers can be connected later

## Data model requirements
Create types/schemas for:
- Country
- IndicatorDefinition
- IndicatorObservation
- CountryProfile
- RiskScore
- SourceMeta
- Watchlist

## Mock data requirements
Seed realistic sample data for at least:
- 25+ countries
- multiple years
- multiple indicators
- a few missing values to test fallbacks

## Deliverables
Generate:
1. short implementation plan
2. file tree
3. full code for key files
4. Prisma schema
5. seed script
6. README
7. env example
8. basic tests for important utilities

## UX requirements
- dark by default
- premium typography
- clean spacing
- smooth motion
- analyst-first desktop experience
- good empty/loading/error states

Now begin with the implementation plan, then generate the codebase.