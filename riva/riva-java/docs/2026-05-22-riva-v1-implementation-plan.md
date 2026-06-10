# RIVA v1 Implementation Plan

> Generated: 2026-05-22
> Scope: Get from "compiles" to "runs end-to-end with Ollama" against the scaffold already in `riva-java/`

---

## Current State Assessment

### What compiles and looks correct
- Session (entity, repo, service, controller)
- Chat domain (entities, repos, DTOs, service, controller)
- Case data client (interface + HTTP impl)
- Activity logging (event-driven: event, publisher, listener, entity, repo)
- Shared config (RivaProperties, CORS, HttpClient, exceptions)
- Flyway V1-V4 migrations
- application.yml

### Issues to fix before it can run

| # | Issue | Severity |
|---|-------|----------|
| 1 | **pom.xml is bloated** - has Kafka, WebSocket, session-jdbc, session-redis, MCP client/server, webflux+webmvc together. Webflux + WebMVC coexisting causes Spring Boot to fail to start. Kafka needs a broker. MCP deps are unused. | **Blocker** |
| 2 | **`compose.yaml`** - ports aren't bound to host (e.g., `- '5432'` not `- '5432:5432'`). Spring Boot Docker Compose support handles this, but manual `psql` access won't work. Also no volume for Postgres data. | Medium |
| 3 | **`CaseDataClient` calls a real external service** - for v1 dev we need a stub/mock since the real service isn't available yet. The sample JSON you shared should be returned by a `StubCaseDataClient`. | **Blocker** |
| 4 | **ChatMessageRepository `LIMIT` in JPQL** - `LIMIT :limit` is not valid JPQL; it's native SQL. Needs `Pageable` or `@Query(nativeQuery = true)` or Spring Data's derived method with `Top`. | **Bug** |
| 5 | **ChatSession entity** - `@UniqueConstraint(columnNames = {"userId", "caseId"})` uses Java field names, but Hibernate auto-generates column names as `user_id` / `case_id` with the default naming strategy. Mismatch with `@UniqueConstraint`. | **Bug** |
| 6 | **`ActivityLog.from()` does hand-rolled JSON** - fragile, doesn't escape quotes in values. Should use Jackson `ObjectMapper`. | Medium |
| 7 | **No `@Validated` on `SessionController`** class level - `@NotBlank` on the inner record won't trigger without it or `@Valid`. | Bug |
| 8 | **System prompt is hardcoded in `ChatService.buildMessages()`** - `prompts/investigate.txt` exists but isn't loaded. `RivaProperties.prompt.actionTemplate` is configured but unused. | Medium |
| 9 | **No health-check or readiness endpoint** configured for Docker Compose services. | Low |
| 10 | **`ChatService.persistAssistantMessage`** is called from reactive callbacks (`doOnComplete`, `doOnCancel`) but does JPA work - needs to run in a transactional context, not on the Reactor thread. | **Bug** |

---

## Implementation Phases

### Phase 1: Fix Blockers & Make It Run (Day 1)

**1.1 Clean up `pom.xml`**
- Remove: `spring-boot-starter-kafka`, `spring-boot-starter-websocket`, `spring-boot-starter-session-data-redis`, `spring-boot-starter-session-jdbc`, `spring-ai-starter-mcp-client-webflux`, `spring-ai-starter-mcp-server-webflux`, `spring-boot-starter-webflux`, `spring-boot-starter-webclient`, `spring-boot-starter-data-redis-reactive`
- Remove all corresponding `-test` scope deps for removed starters
- Keep: `webmvc`, `data-jpa`, `data-redis`, `flyway`, `actuator`, `restclient`, Spring AI Ollama + OpenAI, `spring-ai-starter-model-chat-memory`, `spring-ai-starter-model-chat-memory-repository-redis`, Resilience4j, springdoc, Lombok, PostgreSQL driver, devtools, docker-compose
- Since we're removing webflux: refactor `ChatController` to return `SseEmitter` (Spring MVC SSE) instead of `Flux<String>`, and `ChatService.streamChat()` to return `Flux<String>` which the controller subscribes to and pushes into the `SseEmitter`
- Add Testcontainers BOM + PostgreSQL/Redis modules for test scope

**1.2 Create `StubCaseDataClient`**
- New class: `casedata/StubCaseDataClient.java` implements `CaseDataClient`
- Returns the sample JSON you provided (stored as `src/main/resources/stubs/case-sample.json`)
- Activated via Spring profile `stub` using `@Profile("stub")` 
- Mark `HttpCaseDataClient` with `@Profile("!stub")`
- Default active profile in `application.yml`: `stub`

**1.3 Fix `ChatMessageRepository` JPQL**
- Replace `LIMIT :limit` with Spring Data `Pageable`:
  ```java
  @Query("SELECT m FROM ChatMessage m WHERE m.chatSession.id = :sessionId ORDER BY m.createdAt DESC")
  List<ChatMessage> findRecentMessages(UUID sessionId, Pageable pageable);
  ```
- Update caller in `ChatService` to pass `PageRequest.of(0, windowSize + 1)`

**1.4 Fix `ChatSession` unique constraint column names**
- Change to `@UniqueConstraint(columnNames = {"user_id", "case_id"})` to match Hibernate's default `PhysicalNamingStrategy`

**1.5 Fix reactive persistence in `ChatService`**
- Wrap JPA calls in `doOnComplete`/`doOnCancel`/`doOnError` with `TransactionTemplate` to ensure they run in a proper transaction (JPA persistence on Reactor scheduler threads won't have an active transaction)
- Inject `TransactionTemplate` into `ChatService`

**1.6 Fix `compose.yaml`**
- Bind ports to host: `5432:5432`, `6379:6379`, `11434:11434`
- Add `volumes` for Postgres data persistence
- Add healthchecks for Postgres and Redis

**1.7 Load prompt template from resource**
- In `ChatService`, load the system prompt from `prompts/investigate.txt` using Spring's `ResourceLoader` or `@Value("classpath:prompts/investigate.txt")`
- Template should have a `{caseData}` placeholder replaced at runtime

**1.8 Fix `ActivityLog.from()` JSON serialization**
- Inject or statically use Jackson `ObjectMapper` for `attributes` map serialization

**1.9 Verify: `mvn compile` + `mvn spring-boot:run -Dspring.profiles.active=stub`**
- App should start, connect to Docker Compose services (Postgres, Redis, Ollama)
- Flyway should run migrations
- Hit `/api/sessions` and `/api/chat/messages` endpoints manually with `curl`

---

### Phase 2: End-to-End Flow (Day 1-2)

**2.1 Pull Ollama model in Docker Compose**
- Add an init container or startup script to `docker compose` that pulls `llama3.2` (or `llama3.2:1b` for fast local dev)
- Document: `docker compose up -d && docker compose exec ollama ollama pull llama3.2:1b`

**2.2 SSE streaming integration test (manual)**
- `curl -X POST http://localhost:8080/api/sessions -H 'Content-Type: application/json' -d '{"userId":"user1"}'`
- `curl -N -X POST http://localhost:8080/api/chat/messages -H 'Content-Type: application/json' -d '{"userId":"user1","caseId":"d99c9cc0-7f4a-4318-aaa4-b3bc2f618337","message":"Explain this case to me"}'`
- Verify: SSE stream arrives, assistant response is persisted in DB

**2.3 Chat history endpoint test**
- `curl http://localhost:8080/api/chat/d99c9cc0-7f4a-4318-aaa4-b3bc2f618337/messages?userId=user1`
- Verify: returns the user message + assistant response

**2.4 Prompt engineering**
- Tune `prompts/investigate.txt` for the case JSON structure:
  - Extract and name key fields (channel, rule, score, payload fields)
  - Guide the LLM to produce structured analysis: summary, risk indicators, recommended actions
  - Instruct about the nested `payload` JSON (it's a stringified JSON inside the case JSON)

---

### Phase 3: Automated Tests (Day 2-3)

**3.1 Test infrastructure**
- `src/test/resources/application-test.yml` with Testcontainers config
- Base test class with `@Testcontainers` for PostgreSQL + Redis
- Disable Ollama auto-config in tests (mock `ChatClient`)

**3.2 Unit tests**
| Test class | What it covers |
|------------|----------------|
| `SessionServiceTest` | Create, reuse, expired session replacement |
| `ChatServiceTest` | Stream chat with mocked ChatClient + CaseDataClient, history retrieval |
| `StubCaseDataClientTest` | Returns expected JSON, correct caseId |
| `ActivityPersistenceListenerTest` | Event consumed and persisted, failure swallowed |

**3.3 Integration tests**
| Test class | What it covers |
|------------|----------------|
| `SessionControllerIT` | POST /api/sessions - create & idempotent reuse |
| `ChatControllerIT` | POST /api/chat/messages - SSE stream (mocked ChatClient), GET history |
| `FlywayMigrationIT` | All V1-V4 migrations run cleanly on Testcontainers Postgres |

---

### Phase 4: Polish & Developer Experience (Day 3)

**4.1 OpenAPI / Swagger**
- springdoc is already in pom.xml - verify `/swagger-ui.html` renders
- Add `@Operation` / `@Tag` annotations to controllers for better docs

**4.2 Add `@Validated` where missing**
- `SessionController` class-level `@Validated`
- Verify `ChatMessageRequest` validation fires on blank fields

**4.3 Graceful error responses**
- Test that `ApiExceptionHandler` catches:
  - Validation errors (400)
  - `ResourceNotFoundException` (404)
  - `ExternalServiceException` (502)
  - Unexpected errors (500)

**4.4 Logging improvements**
- Structured log format (JSON) for production profile
- Request/response logging filter for debug profile
- Correlation ID via MDC (userId + caseId)

**4.5 Docker Compose dev workflow doc**
- README.md with: prerequisites, `docker compose up`, `mvn spring-boot:run`, curl examples, switching to OpenAI

---

## File Change Summary

| Action | File | Phase |
|--------|------|-------|
| **Modify** | `pom.xml` | 1.1 |
| **Modify** | `compose.yaml` | 1.6 |
| **Modify** | `application.yml` | 1.2, 1.7 |
| **Modify** | `ChatController.java` | 1.1 (Flux to SseEmitter) |
| **Modify** | `ChatService.java` | 1.1, 1.3, 1.5, 1.7 |
| **Modify** | `ChatMessageRepository.java` | 1.3 |
| **Modify** | `ChatSession.java` | 1.4 |
| **Modify** | `HttpCaseDataClient.java` | 1.2 (add @Profile) |
| **Modify** | `ActivityLog.java` | 1.8 |
| **Modify** | `prompts/investigate.txt` | 2.4 |
| **Create** | `casedata/StubCaseDataClient.java` | 1.2 |
| **Create** | `resources/stubs/case-sample.json` | 1.2 |
| **Create** | `test/resources/application-test.yml` | 3.1 |
| **Create** | `test/.../session/SessionServiceTest.java` | 3.2 |
| **Create** | `test/.../chat/ChatServiceTest.java` | 3.2 |
| **Create** | `test/.../casedata/StubCaseDataClientTest.java` | 3.2 |
| **Create** | `test/.../activity/ActivityPersistenceListenerTest.java` | 3.2 |
| **Create** | `test/.../session/SessionControllerIT.java` | 3.3 |
| **Create** | `test/.../chat/ChatControllerIT.java` | 3.3 |
| **Create** | `README.md` | 4.5 |

---

## Decisions & Notes

1. **WebMVC only, no WebFlux** - Spring Boot 4 does not cleanly support both on the classpath. We use `SseEmitter` for SSE streaming, which is the standard Spring MVC approach. `ChatService` still returns `Flux<String>` internally (from Spring AI) - the controller subscribes and pushes to `SseEmitter`.

2. **Stub profile for dev** - `spring.profiles.active=stub` lets you develop without the real case service. When the real API is available, just run without the `stub` profile and configure `riva.case-service.base-url`.

3. **Model choice** - `llama3.2:1b` for fast local iteration, `llama3.2` (3B) for better quality. Switch in `application.yml` or via `SPRING_AI_OLLAMA_CHAT_MODEL` env var.

4. **No auth** - userId in request body, no security filters. Add later.

5. **Payload parsing** - The case JSON has a `payload` field that is itself a stringified JSON. The prompt template should instruct the LLM to parse this, or we pre-parse it in `ChatService` before sending to the LLM for cleaner context.
