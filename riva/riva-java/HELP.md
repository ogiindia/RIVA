# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.6/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.6/maven-plugin/build-image.html)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/4.0.6/reference/using/devtools.html)
* [Docker Compose Support](https://docs.spring.io/spring-boot/4.0.6/reference/features/dev-services.html#features.dev-services.docker-compose)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.6/reference/web/servlet.html)
* [Spring Reactive Web](https://docs.spring.io/spring-boot/4.0.6/reference/web/reactive.html)
* [HTTP Client](https://docs.spring.io/spring-boot/4.0.6/reference/io/rest-client.html#io.rest-client.restclient)
* [Reactive HTTP Client](https://docs.spring.io/spring-boot/4.0.6/reference/io/rest-client.html#io.rest-client.webclient)
* [Spring Session for Spring Data Redis](https://docs.spring.io/spring-session/reference/)
* [Spring Session for JDBC](https://docs.spring.io/spring-session/reference/)
* [SpringDoc OpenAPI](https://springdoc.org/)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.6/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Flyway Migration](https://docs.spring.io/spring-boot/4.0.6/how-to/data-initialization.html#howto.data-initialization.migration-tool.flyway)
* [Spring Data Redis (Access+Driver)](https://docs.spring.io/spring-boot/4.0.6/reference/data/nosql.html#data.nosql.redis)
* [Spring Data Reactive Redis](https://docs.spring.io/spring-boot/4.0.6/reference/data/nosql.html#data.nosql.redis)
* [Spring for Apache Kafka](https://docs.spring.io/spring-boot/4.0.6/reference/messaging/kafka.html)
* [WebSocket](https://docs.spring.io/spring-boot/4.0.6/reference/messaging/websockets.html)
* [Spring Boot Actuator](https://docs.spring.io/spring-boot/4.0.6/reference/actuator/index.html)
* [Resilience4J](https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j.html)
* [Model Context Protocol Server](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)
* [Model Context Protocol Client](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-client-boot-starter-docs.html)
* [Ollama](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html)
* [OpenAI](https://docs.spring.io/spring-ai/reference/api/chat/openai-chat.html)
* [In-memory Chat Memory Repository](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
* [Redis Chat Memory Repository](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Building a Reactive RESTful Web Service](https://spring.io/guides/gs/reactive-rest-service/)
* [SpringDoc OpenAPI](https://github.com/springdoc/springdoc-openapi-demos/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Messaging with Redis](https://spring.io/guides/gs/messaging-redis/)
* [Messaging with Redis](https://spring.io/guides/gs/messaging-redis/)
* [Using WebSocket to build an interactive web application](https://spring.io/guides/gs/messaging-stomp-websocket/)
* [Building a RESTful Web Service with Spring Boot Actuator](https://spring.io/guides/gs/actuator-service/)

### Docker Compose support
This project contains a Docker Compose file named `compose.yaml`.
In this file, the following services have been defined:

* ollama: [`ollama/ollama:latest`](https://hub.docker.com/r/ollama/ollama)
* postgres: [`postgres:latest`](https://hub.docker.com/_/postgres)
* redis: [`redis/redis-stack:latest`](https://hub.docker.com/r/redis/redis-stack)

Please review the tags of the used images and set them to the same as you're running in production.

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

