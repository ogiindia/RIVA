# Graph Report - .  (2026-05-04)

## Corpus Check
- Corpus is ~15,004 words - fits in a single context window. You may not need a graph.

## Summary
- 279 nodes · 337 edges · 22 communities detected
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.83)
- Token cost: 13,900 input · 2,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Landing Page Animations|Landing Page Animations]]
- [[_COMMUNITY_Modal Components & State|Modal Components & State]]
- [[_COMMUNITY_Design Token System|Design Token System]]
- [[_COMMUNITY_API Client Functions|API Client Functions]]
- [[_COMMUNITY_App Bootstrap & Context|App Bootstrap & Context]]
- [[_COMMUNITY_Chat View & Investigation|Chat View & Investigation]]
- [[_COMMUNITY_App Layout & CSS|App Layout & CSS]]
- [[_COMMUNITY_Chat UI Styling|Chat UI Styling]]
- [[_COMMUNITY_Message Rendering Utils|Message Rendering Utils]]
- [[_COMMUNITY_App Icons & Brand Assets|App Icons & Brand Assets]]
- [[_COMMUNITY_Text Color Tokens|Text Color Tokens]]
- [[_COMMUNITY_FIS Brand Identity|FIS Brand Identity]]
- [[_COMMUNITY_Hero Visual Design|Hero Visual Design]]
- [[_COMMUNITY_Landing Input Controls|Landing Input Controls]]
- [[_COMMUNITY_Modal Overlay Styles|Modal Overlay Styles]]
- [[_COMMUNITY_Project Config Docs|Project Config Docs]]
- [[_COMMUNITY_Suggestion Parse-Display|Suggestion Parse-Display]]
- [[_COMMUNITY_Landing Typography|Landing Typography]]
- [[_COMMUNITY_ESLint Settings|ESLint Settings]]
- [[_COMMUNITY_Chat Input (Semantic)|Chat Input (Semantic)]]
- [[_COMMUNITY_View Active Class|View Active Class]]
- [[_COMMUNITY_Alert Input Field|Alert Input Field]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 21 edges
2. `ChatView Component` - 13 edges
3. `apiFetch (internal fetch wrapper)` - 13 edges
4. `CSS Custom Properties Theming System` - 11 edges
5. `useApp()` - 10 edges
6. `Landing Stat Card` - 9 edges
7. `Design Token: --accent` - 8 edges
8. `Media Query: Compact Mode (max-width 400px)` - 8 edges
9. `Chat Message Styling Token Group` - 7 edges
10. `Landing Logo Inner (Animated Pulse)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Vite Config` --references--> `RIVA Project CLAUDE.md`  [INFERRED]
  vite.config.js → CLAUDE.md
- `AppContext (Global State)` --implements--> `AppContext State Management Architecture`  [INFERRED]
  src/context/AppContext.jsx → CLAUDE.md
- `parsePriorityFromReport Utility` --conceptually_related_to--> `API Client Architecture (apiFetch)`  [INFERRED]
  src/utils/parsePriority.js → CLAUDE.md
- `Index HTML Entry Point` --references--> `Main Entry (main.jsx)`  [EXTRACTED]
  index.html → src/main.jsx
- `ChatView Component` --semantically_similar_to--> `LandingView Component`  [INFERRED] [semantically similar]
  src/components/views/ChatView.jsx → src/components/views/LandingView.jsx

## Hyperedges (group relationships)
- **Chat Message Rendering Pipeline** — messagebubble_messagebubble, formattext_getstreamdisplayhtml, streamingindicator_streamingindicator [INFERRED 0.85]
- **App Bootstrap and Session Init Flow** — main_entry, app_app, appcontext_appprovider [EXTRACTED 0.95]
- **LLM Suggestion Parse and Display Flow** — parsesuggestions_parsesuggestions, suggestionpills_suggestionpills, chatinput_chatinput [INFERRED 0.75]
- **Alert Investigation Flow: ChatView + API Streams + savePartial** — chatview_chatview, client_streaminvestigate, client_savepartialtoserver [INFERRED 0.90]
- **Sidebar Alert History Management: Sidebar + useAlertHistory + getAlertList** — sidebar_sidebar, usealerthistory_usealerthistory, client_getalertlist [EXTRACTED 1.00]
- **Theme Persistence Flow: TopBar + useTheme + getPreference/setPreference** — topbar_topbar, usetheme_usetheme, client_getpreference [EXTRACTED 1.00]

## Communities

### Community 0 - "Landing Page Animations"
Cohesion: 0.06
Nodes (49): Animation: borderShimmer, Animation: compactCardEnter, Animation: dataStream, Animation: logoPulse, Animation: orbitSpin, Animation: scanLine, Landing Submit Button, Landing Content Container (+41 more)

### Community 1 - "Modal Components & State"
Cohesion: 0.08
Nodes (14): ColumnField(), ExternalListModal(), inputTypeFor(), stepFor(), RuleSuggestion(), useApp(), useAlertHistory(), useTheme() (+6 more)

### Community 2 - "Design Token System"
Cohesion: 0.1
Nodes (28): Accent Glow Token (--accent-glow), Accent Hover Token (--accent-hover), Accent Color Token (--accent), Background Color Token Group, Background Card Token (--bg-card), Background Hover Token (--bg-hover), Background Primary Token (--bg-primary), Background Secondary Token (--bg-secondary) (+20 more)

### Community 3 - "API Client Functions"
Cohesion: 0.14
Nodes (24): apiFetch(), buildHeaders(), closeAlert(), deleteChatHistory(), downloadReport(), fetchSession(), generateRule(), getAlertList() (+16 more)

### Community 4 - "App Bootstrap & Context"
Cohesion: 0.09
Nodes (24): App Root Component, AppContext (Global State), AppProvider, AppContext Initial State, AppContext Reducer, useApp Hook, API Client Architecture (apiFetch), RIVA Data Flow Architecture (+16 more)

### Community 5 - "Chat View & Investigation"
Cohesion: 0.13
Nodes (24): ChatView Component, apiFetch (internal fetch wrapper), closeAlert, deleteChatHistory, downloadReport, fetchSession, getAlertList, getAlertStatus (+16 more)

### Community 6 - "App Layout & CSS"
Cohesion: 0.11
Nodes (19): anim-stagger Entrance Animation, app.css - Main Application Stylesheet, app-layout Flex Container, content-area Scrollable Region, --accent Design Token, --bg-primary / --bg-secondary Design Tokens, --text-primary / --text-secondary Design Tokens, Flex Column Layout Pattern (+11 more)

### Community 7 - "Chat UI Styling"
Cohesion: 0.13
Nodes (15): btn-send Send Button, chat-alert-bar Alert Info Strip, chat-bubble-assistant Agent Bubble, chat-bubble Message Bubble, chat-bubble-user User Bubble, chat-input-area Input Footer, chat-input-group Textarea Container, chat-messages Scrollable Message List (+7 more)

### Community 8 - "Message Rendering Utils"
Cohesion: 0.32
Nodes (4): MessageBubble(), formatText(), getStreamDisplayHtml(), getInitials()

### Community 9 - "App Icons & Brand Assets"
Cohesion: 0.25
Nodes (8): Riva App Favicon, Bluesky Social Icon, Discord Icon, Documentation Icon, GitHub Icon, Social / User Profile Icon, X (Twitter) Icon, Riva UI Icon Set

### Community 10 - "Text Color Tokens"
Cohesion: 0.83
Nodes (4): Text Color Token Group, Text Muted Token (--text-muted), Text Primary Token (--text-primary), Text Secondary Token (--text-secondary)

### Community 11 - "FIS Brand Identity"
Cohesion: 0.5
Nodes (4): FIS (Fidelity National Information Services), FIS Green Color Scheme, FIS Logo (Green Variant), FIS White Logo

### Community 12 - "Hero Visual Design"
Cohesion: 0.83
Nodes (4): Hero Image - Layered Isometric Shapes Illustration, Isometric Illustration Style, Layered Shape Design Element, Purple Brand Accent Color

### Community 14 - "Landing Input Controls"
Cohesion: 0.67
Nodes (3): btn-investigate Primary Action Button, input-group Input Container, panel Card Component

### Community 15 - "Modal Overlay Styles"
Cohesion: 0.67
Nodes (3): confirm-modal Confirmation Dialog, suggest-rule-modal Modal Dialog, suggest-rule-overlay Modal Overlay

### Community 22 - "Project Config Docs"
Cohesion: 1.0
Nodes (2): RIVA Project CLAUDE.md, Vite Config

### Community 23 - "Suggestion Parse-Display"
Cohesion: 1.0
Nodes (2): parseSuggestions Utility, SuggestionPills Component

### Community 24 - "Landing Typography"
Cohesion: 1.0
Nodes (2): Landing Subtitle, Design Token: --text-secondary

### Community 28 - "ESLint Settings"
Cohesion: 1.0
Nodes (1): ESLint Config

### Community 29 - "Chat Input (Semantic)"
Cohesion: 1.0
Nodes (1): ChatInput Component

### Community 30 - "View Active Class"
Cohesion: 1.0
Nodes (1): view-active Visible View

### Community 31 - "Alert Input Field"
Cohesion: 1.0
Nodes (1): alert-input Monospace Text Field

## Knowledge Gaps
- **73 isolated node(s):** `Vite Config`, `ESLint Config`, `Index HTML Entry Point`, `RIVA Project CLAUDE.md`, `AppContext (Global State)` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Project Config Docs`** (2 nodes): `RIVA Project CLAUDE.md`, `Vite Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Suggestion Parse-Display`** (2 nodes): `parseSuggestions Utility`, `SuggestionPills Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Landing Typography`** (2 nodes): `Landing Subtitle`, `Design Token: --text-secondary`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Settings`** (1 nodes): `ESLint Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Chat Input (Semantic)`** (1 nodes): `ChatInput Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `View Active Class`** (1 nodes): `view-active Visible View`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Alert Input Field`** (1 nodes): `alert-input Monospace Text Field`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CSS Custom Properties Theming System` connect `Design Token System` to `Text Color Tokens`, `App Layout & CSS`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `useApp()` connect `Modal Components & State` to `Message Rendering Utils`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ChatView Component` (e.g. with `Sidebar Component` and `useAlertHistory Hook`) actually correct?**
  _`ChatView Component` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `useApp()` (e.g. with `App()` and `MessageBubble()`) actually correct?**
  _`useApp()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Vite Config`, `ESLint Config`, `Index HTML Entry Point` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Landing Page Animations` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Modal Components & State` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._