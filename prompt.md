Act as a principal full-stack engineer, product architect, geospatial data engineer, and data-visualization designer.

Build a production-quality web app called **MapFactbook**.

The product vision:
MapFactbook is a modern, premium, interactive world economic intelligence platform that combines a beautiful world map, country factbook, subnational drill-down, comparison tools, rankings, forecasting, risk, trade, demographics, sustainability, and exportable reports.

Important:
- Build **everything except news**.
- Do **not** add news feeds, headlines, article cards, or breaking-news widgets.
- Make strong, sensible assumptions and move forward without asking for clarification.
- Start with a concrete implementation plan, then generate the codebase.
- Prefer a modular architecture so data providers can be swapped later.
- Use sample/mock data where real global coverage is difficult, but design the app so real sources can be plugged in later.
- Handle missing data gracefully and transparently.
- Make the UI look modern, premium, dark-by-default, and highly polished.

## Recommended stack
Use:
- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for UI/global state
- TanStack Query for async data
- MapLibre GL JS for maps
- deck.gl when useful for advanced layers and flow visualizations
- Recharts for charts
- Framer Motion for animations
- Prisma with SQLite for local dev persistence
- Zod for schema validation
- date-fns for dates
- a small provider-agnostic AI insight service layer
- local mock datasets + adapter interfaces for future real data integrations

If some library choice creates friction, choose the closest robust alternative and continue.

## Core product requirements

### 1. Modern world map homepage
Create a beautiful, interactive world map with:
- dark premium theme
- smooth hover states
- zoom and pan
- search bar
- metric selector
- year selector / time slider
- region filter
- economic bloc filter
- left/right side panels
- responsive layout

The homepage should immediately feel like a high-end economic intelligence terminal.

### 2. Country overview cards
When a country is clicked, show an initial overview panel with:
- country name
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
- policy interest rate
- credit rating
- latest available year
- data source metadata
- missing-data notices if needed

### 3. Country profile pages
Create full country pages with tabs:
- Overview
- Economy
- Trade
- Demographics
- Labor
- Government Finance
- Monetary & Currency
- Energy & Sustainability
- Infrastructure & Logistics
- Business Environment
- Risk
- Regions
- Historical Timeline
- Forecasts
- Methodology / Sources

### 4. Province / state drill-down
Support subnational drill-down:
- country -> state/province
- subnational map layer when available
- regional GDP
- regional GDP per capita
- unemployment
- median income
- population
- sector composition
- exports
- industrial output
- education/labor data
- urbanization
- infrastructure indicators

Design this as ADM0 country and ADM1 subnational hierarchy.
Gracefully show “data unavailable” where subnational coverage is missing.

### 5. Multiple map visualization modes
Support:
- choropleth mode
- bubble mode
- heat/density mode
- categorical mode
- flow mode for trade routes
- sector overlay mode

### 6. Time slider and historical exploration
Add a year/time slider so users can:
- animate indicators over time
- compare current vs past values
- scrub through years
- play/pause time animation
- view mini time-series charts on hover or click

### 7. Compare mode
Allow users to compare 2–5 countries or subnational regions side by side with:
- KPI cards
- line charts
- bar charts
- radar chart
- rankings
- normalized comparisons
- downloadable comparison report

### 8. Rankings panel
Create a rankings view with filters and sorting for:
- GDP
- GDP per capita
- inflation
- unemployment
- population
- exports
- imports
- debt-to-GDP
- growth
- emissions
- inequality
- business environment
- risk scores
and more.

### 9. Indicator library
Create a large indicator browser with categories:
- Macroeconomy
- Trade
- Labor
- Public Finance
- Monetary & Currency
- Demographics
- Energy
- Sustainability
- Inequality & Welfare
- Technology
- Education
- Health
- Infrastructure
- Business Environment
- Risk

Each indicator should have:
- name
- definition
- unit
- formula/notes where useful
- category
- latest year available
- source
- coverage notes

### 10. Custom dashboard builder
Users can:
- pin indicators
- pin countries/regions
- save custom dashboard layouts
- rearrange widgets
- create named dashboards
- persist to database
- fall back to local storage if auth is absent

### 11. Economic structure view
For countries and regions, add:
- sector composition
- top industries
- top exports
- top imports
- top trade partners
- strategic sectors
- economic complexity style summary if data exists
- company/industry concentration placeholders if needed

### 12. Trade flow map
Add a dedicated trade view with:
- origin-destination flow lines/arcs
- partner ranking tables
- export/import composition
- bilateral trade values
- commodity/product grouping support
- toggles for exports/imports/total trade

### 13. Inflation and currency explorer
Dedicated section for:
- CPI inflation
- PPI inflation
- policy rate
- exchange rate history
- currency depreciation/appreciation
- purchasing power comparisons
- external balance context

### 14. Risk layer
Build a risk framework and UI for:
- sovereign risk
- inflation risk
- debt risk
- external vulnerability
- political/institutional risk placeholders
- sanctions exposure placeholder
- climate vulnerability
- commodity dependence
- banking/financial fragility placeholder

If exact real-world risk data is absent in mock mode, create a transparent composite-score framework with clear methodology labels.

### 15. Forecast layer
Create a forecasts section for:
- GDP growth
- inflation
- unemployment
- debt path
- population
- emissions where available

Implementation:
- Use mock/sample forecast data for demo mode
- Also scaffold a forecasting service layer so models can be plugged in later
- Make forecast cards clearly labeled as forecast, not actual
- Support baseline / optimistic / pessimistic scenarios

### 16. Historical events timeline
For each country, support a historical timeline view with events such as:
- crises
- devaluations
- recessions
- reforms
- IMF programs
- elections
- wars/conflicts
- sanctions
- major policy turning points

This should be a structured dataset, not a news feed.

### 17. Regional blocs and unions
Support filters and aggregated views for:
- EU
- OECD
- G20
- ASEAN
- BRICS
- GCC
- African Union
- Mercosur
- Turkic States
- custom collections

Users should be able to compare a country with bloc averages.

### 18. Economic similarity engine
Create a “similar economies/regions” feature based on configurable similarity dimensions like:
- GDP per capita
- sector mix
- inflation
- unemployment
- trade openness
- population
- urbanization
- energy structure
- emissions profile

Build it as a transparent scoring engine, not a black box.

### 19. Data explainers
Add small explainers/tooltips/help drawers for key concepts such as:
- GDP
- real vs nominal GDP
- PPP
- inflation
- current account
- debt-to-GDP
- labor force participation
- Gini
- carbon intensity
- etc.

### 20. AI insight box
Add an AI insight feature where the user can ask:
- summarize this economy
- compare A and B
- explain why inflation is high
- summarize the labor market
- explain regional disparities

Implementation requirements:
- provider-agnostic architecture
- a stub/mock local provider for dev
- prompt templates
- citation hooks to internal data records
- no news integration
- answers must be based on in-app data context where possible

### 21. Sector map overlays
Support overlays for:
- agriculture
- manufacturing
- mining
- oil & gas
- tourism
- finance
- technology
- logistics
- energy infrastructure

### 22. Infrastructure and logistics layer
Add indicators and views for:
- ports
- airports
- rail
- roads
- logistics performance
- internet penetration
- electricity access
- trade corridors

### 23. Demographics and labor layer
Add:
- median age
- fertility
- urbanization
- migration
- labor force participation
- youth unemployment
- education attainment
- dependency ratio

### 24. Inequality and welfare layer
Add:
- Gini
- poverty rate
- social spending
- HDI-style placeholder structure if needed
- minimum wage
- regional inequality

### 25. Energy and sustainability layer
Add:
- energy mix
- oil/gas production
- renewables share
- electricity generation mix
- emissions
- emissions per capita
- carbon intensity
- climate vulnerability
- energy prices if available

### 26. Business environment layer
Add:
- tax burden
- corporate tax
- startup conditions
- corruption/institution quality placeholders
- regulatory burden
- labor regulation placeholders
- investment attractiveness framework

### 27. Save / export / report generation
Support:
- save views
- export charts as PNG/SVG
- export tables as CSV
- generate printable PDF-style country reports
- generate comparison reports
- shareable URLs with filters encoded

### 28. Storytelling mode
Create a “story mode” where curated narratives can be assembled from app data, such as:
- inflation crisis walkthrough
- trade dependence story
- regional inequality story
- energy transition story

This should use internal data, charts, and annotations only.

### 29. Alert / watchlist system
Users can:
- save countries/regions
- define simple threshold alerts
- trigger in-app alert center items when mock data crosses thresholds
- manage watchlists

Do not implement external email/SMS. In-app only is enough.

### 30. Data source transparency
Every metric and chart should support:
- source label
- dataset/update metadata
- notes
- coverage quality
- missing-data warnings
- actual vs estimate vs forecast tags

## UX / design requirements
- Dark premium UI by default
- Strong typography hierarchy
- Beautiful spacing
- Smooth motion
- Modern control panels
- High information density without clutter
- Mobile responsive, but optimized for desktop analysts first
- Keyboard-friendly search and navigation
- Fast, professional feel, like a serious economic terminal

## Architecture requirements
Build this cleanly with:
- feature-based folder structure
- reusable map layer system
- reusable chart components
- reusable data table components
- strong TypeScript typing
- Zod schemas for domain objects
- mock data adapters
- service layer for:
  - geo data
  - indicators
  - rankings
  - trade
  - forecasts
  - similarity
  - AI insights
  - alerts
  - exports

## Data modeling requirements
Create explicit schemas/interfaces for:
- Country
- Region/SubnationalUnit
- IndicatorDefinition
- IndicatorObservation
- TradeFlow
- ForecastSeries
- HistoricalEvent
- RiskScore
- Bloc
- Dashboard
- Watchlist
- AlertRule
- SourceMeta

## Geo requirements
- Support world countries now
- Support ADM1 subnational units where available in mock/sample coverage
- Make map layer loading modular
- Use TopoJSON/GeoJSON efficiently
- Simplify boundaries if needed for performance
- Keep labels performant

## Performance requirements
- Lazy load heavy map and chart modules
- Virtualize long tables where useful
- Cache derived computations
- Keep initial load reasonable
- Avoid rendering all heavy layers at once

## Developer experience requirements
Generate:
- complete runnable project
- sensible file tree
- seed script for mock data
- README with setup instructions
- architecture notes
- TODO markers where real data providers can be connected later
- environment variable examples
- basic tests for core utility functions
- comments only where they add value

## Implementation strategy
Do this in order:
1. Write a short but concrete implementation plan
2. Generate the folder structure
3. Generate core types/schemas
4. Generate mock data and adapters
5. Build layout and design system
6. Build homepage map
7. Build country pages
8. Build subnational drill-down
9. Build compare/rankings/library
10. Build trade/risk/forecast/timeline/similarity/AI/story/report/watchlist
11. Add export and persistence
12. Write README and final notes

## Deliverables
I want:
- the code
- the project structure
- key files fully written
- realistic mock data seeds
- reusable components
- no placeholder hand-waving
- clear explanation of what is complete and what is scaffolded

## Important constraints
- Exclude news entirely
- No shallow toy app
- No generic dashboard template
- No vague pseudo-code unless absolutely necessary
- Prefer working implementation over excessive explanation
- When data is uncertain or incomplete globally, build elegant fallbacks and document assumptions
- Make the app feel premium, serious, and extensible

Now begin with the implementation plan and then start generating the actual codebase.