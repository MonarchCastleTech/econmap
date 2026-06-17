Act as a principal full-stack engineer and continue upgrading the existing **MapFactbook** codebase.

You are not starting over. You are extending the current project cleanly.

Important:
- Exclude news entirely.
- Do not remove working MVP features.
- Preserve architecture quality.
- Refactor where needed.
- Do not ask clarifying questions.

## Goal
Upgrade MapFactbook from MVP into a serious multi-layer economic intelligence platform with subnational, trade, forecast, timeline, similarity, dashboard, and explainability features.

## Add these advanced features

### 1. Province / state drill-down
Add ADM1-style subnational support:
- country -> state/province drill-down
- subnational map layer when available
- region profile pages
- region overview cards
- regional GDP
- GDP per capita
- unemployment
- population
- median income
- sector composition
- exports
- industrial output
- education/labor indicators
- urbanization
- infrastructure indicators

Use sample coverage for a handful of countries if needed, but build the architecture for broader future coverage.

### 2. Multiple map modes
Support:
- choropleth
- bubble
- heat/density
- categorical
- sector overlay
- trade flow mode

### 3. Time slider animation
Upgrade time exploration with:
- play/pause year animation
- historical scrubbing
- current vs past comparison
- mini sparkline on hover/click where suitable

### 4. Custom dashboard builder
Users can:
- pin indicators
- pin countries/regions
- create named dashboards
- rearrange cards/widgets
- persist layouts in DB or local storage fallback

### 5. Trade intelligence module
Build a dedicated trade section with:
- trade flow arcs/lines on map
- top partners
- export/import composition
- bilateral trade tables
- commodity grouping
- export vs import toggles

Create reusable trade schemas and adapters.

### 6. Inflation and currency explorer
Add a dedicated explorer for:
- CPI
- PPI
- policy rate
- exchange rate history
- depreciation/appreciation summary
- purchasing power context
- external balance summary

### 7. Risk framework
Create transparent composite risk scoring with methodology labels for:
- sovereign risk
- inflation risk
- debt risk
- external vulnerability
- climate vulnerability
- commodity dependence
- institutional/political placeholder risk
- financial fragility placeholder risk

Scores must explain their components.

### 8. Forecast layer
Add:
- GDP growth forecast
- inflation forecast
- unemployment forecast
- debt path forecast
- population forecast
- emissions forecast placeholder if useful

Support scenarios:
- baseline
- optimistic
- pessimistic

Clearly label forecast vs actual.

### 9. Historical timeline
Add structured historical timelines for countries:
- crises
- devaluations
- reforms
- IMF programs
- recessions
- sanctions
- elections
- conflicts
- major policy turning points

This is not news. It is a historical structured dataset.

### 10. Regional blocs and custom groups
Support:
- EU
- OECD
- G20
- ASEAN
- BRICS
- GCC
- African Union
- Mercosur
- Turkic States
- custom saved collections

Add bloc average comparison.

### 11. Economic similarity engine
Create a transparent similarity engine based on dimensions like:
- GDP per capita
- sector mix
- inflation
- unemployment
- trade openness
- population
- urbanization
- energy structure
- emissions profile

Show “similar countries” and “similar regions” with score breakdowns.

### 12. Data explainers
Add contextual explainers/tooltips/drawers for:
- GDP
- nominal vs real
- PPP
- inflation
- current account
- debt-to-GDP
- labor force participation
- Gini
- carbon intensity
- trade openness
- dependency ratio

### 13. AI insight box
Add a provider-agnostic AI insight layer.
It must:
- use in-app data context
- support prompt templates
- have a local stub/mock provider for development
- cite internal data records where possible
- answer things like:
  - summarize this economy
  - compare A and B
  - explain why inflation is high
  - explain regional disparities
  - summarize trade structure

No news, no external headlines.

### 14. Energy, sustainability, infrastructure, welfare, business environment
Extend country and region pages with:
- energy mix
- renewables share
- electricity mix
- emissions
- emissions per capita
- carbon intensity
- climate vulnerability
- ports
- airports
- rail/road placeholders
- internet penetration
- electricity access
- Gini
- poverty
- social spending
- business environment indicators
- tax burden
- regulatory burden placeholders
- investment attractiveness framework

### 15. Story mode
Create an internal storytelling mode using app data only:
- inflation story
- trade dependence story
- regional inequality story
- energy transition story

Use charts, annotations, and narrative blocks.

### 16. Report generation
Support:
- printable country reports
- printable comparison reports
- better export pipeline
- reusable report components

## Engineering requirements
- keep code modular
- refactor duplicates
- add schemas for new modules
- seed more realistic mock data
- add tests for similarity/risk/forecast logic
- maintain performance with lazy loading for heavy sections

## Deliverables
Output:
1. upgrade plan
2. updated file tree
3. modified/new key files with real code
4. schema changes
5. seed updates
6. README updates
7. explanation of what is fully implemented vs scaffolded

Now upgrade the existing MapFactbook codebase.