import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FreeNewsApi - API de Notícias",
      version: "1.0.0",
      description:
        "API proxy entre um aplicativo móvel de notícias e o FreeNewsApi.io. Sincroniza artigos a cada hora em um banco SQLite local. Suporta autenticação de usuários, filtragem por palavras-chave, fila de leitura posterior e favoritos.",
    },
    servers: [{ url: "http://localhost:3001", description: "Desenvolvimento" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string", example: "Mensagem de erro descritiva" },
              },
            },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 342 },
            totalPages: { type: "integer", example: 18 },
          },
        },
        Article: {
          type: "object",
          properties: {
            uuid: { type: "string", format: "uuid", example: "abc123" },
            title: { type: "string", example: "Some News Headline" },
            publisher: { type: "string", example: "Folha de S.Paulo" },
            publishedAt: { type: "string", format: "date-time" },
            thumbnail: { type: "string", nullable: true, example: null },
            categories: { type: "array", items: { type: "string" }, example: ["politics"] },
          },
        },
        ArticleDetail: {
          type: "object",
          properties: {
            uuid: { type: "string", format: "uuid" },
            title: { type: "string" },
            publisher: { type: "string" },
            publishedAt: { type: "string", format: "date-time" },
            thumbnail: { type: "string", nullable: true },
            originalUrl: { type: "string" },
            body: { type: "string", description: "Texto completo do artigo" },
            authors: { type: "string" },
            categories: { type: "array", items: { type: "string" } },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
          },
        },
        MutedKeyword: {
          type: "object",
          properties: {
            id: { type: "integer", example: 5 },
            userId: { type: "integer", example: 1 },
            keyword: { type: "string", example: "eleições" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ReadLaterEntry: {
          type: "object",
          properties: {
            userId: { type: "integer", example: 1 },
            articleUuid: { type: "string", format: "uuid", example: "abc123" },
            savedAt: { type: "string", format: "date-time" },
            article: {
              type: "object",
              properties: {
                title: { type: "string" },
                publisher: { type: "string" },
                publishedAt: { type: "string", format: "date-time" },
                thumbnail: { type: "string", nullable: true },
              },
            },
          },
        },
        RemovedResponse: {
          type: "object",
          properties: {
            removed: { type: "boolean", example: true },
          },
        },
        FavoriteEntry: {
          type: "object",
          properties: {
            userId: { type: "integer", example: 1 },
            articleUuid: { type: "string", format: "uuid", example: "abc123" },
            createdAt: { type: "string", format: "date-time" },
            title: { type: "string" },
            publisher: { type: "string" },
            publishedAt: { type: "string", format: "date-time" },
            thumbnail: { type: "string", nullable: true },
          },
        },
        Comment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            userId: { type: "integer", example: 1 },
            articleUuid: { type: "string", format: "uuid" },
            content: { type: "string", example: "Excelente artigo!" },
            createdAt: { type: "string", format: "date-time" },
            username: { type: "string", example: "joaosilva" },
            replies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  userId: { type: "integer" },
                  articleUuid: { type: "string" },
                  parentId: { type: "integer" },
                  content: { type: "string" },
                  createdAt: { type: "string" },
                  username: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Verifica se o servidor está rodando",
          responses: {
            "200": {
              description: "Servidor ativo",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: { status: { type: "string", example: "ok" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/news": {
        get: {
          tags: ["Notícias"],
          summary: "Lista artigos do banco local com paginação e filtro opcional por categoria",
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
              description:
                "Filtrar por categoria (politics, world, business, technology, science, gaming, education, travel, sports)",
            },
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", default: 1 },
              description: "Número da página (base 1)",
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20, maximum: 50 },
              description: "Itens por página (1–50)",
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Busca por título (LIKE)",
            },
            {
              name: "published_from",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filtrar a partir desta data (ISO)",
            },
            {
              name: "published_to",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filtrar até esta data (ISO)",
            },
          ],
          responses: {
            "200": {
              description: "Lista de artigos paginada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Article" },
                      },
                      meta: { $ref: "#/components/schemas/PaginationMeta" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/details": {
        get: {
          tags: ["Notícias"],
          summary:
            "Busca detalhes completos do artigo (corpo, autores, thumbnail). Usa cache-aside: busca do FreeNewsApi na primeira requisição e persiste localmente.",
          parameters: [
            {
              name: "uuid",
              in: "query",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID do artigo",
            },
          ],
          responses: {
            "200": {
              description: "Detalhes do artigo",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/ArticleDetail" },
                    },
                  },
                },
              },
            },
            "400": { description: "Formato de UUID inválido" },
            "404": { description: "UUID do artigo não encontrado" },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Autenticação"],
          summary: "Cria uma nova conta de usuário",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "username", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "user@example.com" },
                    username: {
                      type: "string",
                      minLength: 3,
                      maxLength: 30,
                      example: "joaosilva",
                    },
                    password: {
                      type: "string",
                      minLength: 6,
                      maxLength: 100,
                      example: "securePassword123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Usuário criado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AuthResponse" },
                    },
                  },
                },
              },
            },
            "409": { description: "Email ou username já cadastrado" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Autenticação"],
          summary: "Autentica com email/username + senha",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["emailOrUsername", "password"],
                  properties: {
                    emailOrUsername: {
                      type: "string",
                      example: "user@example.com",
                      description: "Email ou username do usuário",
                    },
                    password: { type: "string", example: "securePassword123" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Autenticado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AuthResponse" },
                    },
                  },
                },
              },
            },
            "401": { description: "Credenciais inválidas" },
          },
        },
      },
      "/me/news": {
        get: {
          tags: ["Usuário (Autenticado)"],
          summary:
            "Lista artigos filtrados pelas palavras silenciadas do usuário autenticado",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "category",
              in: "query",
              required: false,
              schema: { type: "string" },
            },
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", default: 20, maximum: 50 },
            },
            {
              name: "search",
              in: "query",
              required: false,
              schema: { type: "string" },
              description: "Busca por título (LIKE)",
            },
            {
              name: "published_from",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filtrar a partir desta data (ISO)",
            },
            {
              name: "published_to",
              in: "query",
              required: false,
              schema: { type: "string", format: "date-time" },
              description: "Filtrar até esta data (ISO)",
            },
          ],
          responses: {
            "200": {
              description: "Lista de artigos filtrada",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Article" },
                      },
                      meta: { $ref: "#/components/schemas/PaginationMeta" },
                    },
                  },
                },
              },
            },
            "401": { description: "Token JWT ausente, inválido ou expirado" },
          },
        },
      },
      "/me/mutes": {
        post: {
          tags: ["Usuário (Autenticado)"],
          summary: "Adiciona uma palavra para silenciar no feed de notícias",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["keyword"],
                  properties: {
                    keyword: {
                      type: "string",
                      minLength: 1,
                      maxLength: 100,
                      example: "eleições",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Palavra silenciada com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/MutedKeyword" },
                    },
                  },
                },
              },
            },
            "409": { description: "Palavra já existe para este usuário" },
            "401": { description: "Não autenticado" },
          },
        },
        get: {
          tags: ["Usuário (Autenticado)"],
          summary: "Lista todas as palavras silenciadas do usuário autenticado",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Lista de palavras silenciadas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/MutedKeyword" },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/me/mutes/{id}": {
        delete: {
          tags: ["Usuário (Autenticado)"],
          summary: "Remove uma palavra silenciada pelo ID",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "ID da palavra silenciada",
            },
          ],
          responses: {
            "200": {
              description: "Palavra removida com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RemovedResponse" },
                    },
                  },
                },
              },
            },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/me/read-later": {
        post: {
          tags: ["Usuário (Autenticado)"],
          summary: "Salva um artigo na fila de leitura posterior (expira em 48h)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["articleUuid"],
                  properties: {
                    articleUuid: {
                      type: "string",
                      format: "uuid",
                      example: "abc123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Artigo salvo na fila",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          userId: { type: "integer" },
                          articleUuid: { type: "string" },
                          savedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "UUID do artigo não encontrado" },
            "409": { description: "Artigo já está na fila de leitura posterior" },
            "401": { description: "Não autenticado" },
          },
        },
        get: {
          tags: ["Usuário (Autenticado)"],
          summary: "Lista a fila de leitura posterior do usuário (apenas últimas 48h)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Fila de leitura posterior",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ReadLaterEntry" },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/me/read-later/{articleUuid}": {
        delete: {
          tags: ["Usuário (Autenticado)"],
          summary: "Remove um artigo da fila de leitura posterior",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "articleUuid",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID do artigo",
            },
          ],
          responses: {
            "200": {
              description: "Artigo removido da fila",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RemovedResponse" },
                    },
                  },
                },
              },
            },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/me/favorites": {
        post: {
          tags: ["Usuário (Autenticado)"],
          summary: "Adiciona um artigo aos favoritos do usuário",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["articleUuid"],
                  properties: {
                    articleUuid: {
                      type: "string",
                      format: "uuid",
                      example: "abc123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Artigo favoritado com sucesso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          userId: { type: "integer" },
                          articleUuid: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "UUID do artigo não encontrado" },
            "409": { description: "Artigo já favoritado" },
            "401": { description: "Não autenticado" },
          },
        },
        get: {
          tags: ["Usuário (Autenticado)"],
          summary: "Lista todos os artigos favoritos do usuário",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Lista de favoritos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/FavoriteEntry" },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/me/favorites/{articleUuid}": {
        delete: {
          tags: ["Usuário (Autenticado)"],
          summary: "Remove um artigo dos favoritos",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "articleUuid",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID do artigo",
            },
          ],
          responses: {
            "200": {
              description: "Artigo removido dos favoritos",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RemovedResponse" },
                    },
                  },
                },
              },
            },
            "404": { description: "Favorito não encontrado" },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/comments/{articleUuid}": {
        get: {
          tags: ["Comentários"],
          summary: "Lista comentários de um artigo (público)",
          parameters: [
            {
              name: "articleUuid",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "UUID do artigo",
            },
          ],
          responses: {
            "200": {
              description: "Lista de comentários com respostas",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Comment" },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "Artigo não encontrado" },
          },
        },
      },
      "/comments": {
        post: {
          tags: ["Comentários"],
          summary: "Cria um comentário ou resposta em um artigo",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["articleUuid", "content"],
                  properties: {
                    articleUuid: {
                      type: "string",
                      format: "uuid",
                      example: "abc123",
                    },
                    content: {
                      type: "string",
                      minLength: 1,
                      maxLength: 1000,
                      example: "Excelente artigo!",
                    },
                    parentId: {
                      type: "integer",
                      nullable: true,
                      description: "ID do comentário pai (para respostas)",
                      example: null,
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Comentário criado",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Comment" },
                    },
                  },
                },
              },
            },
            "400": { description: "Erro de validação ou nível de aninhamento excedido" },
            "404": { description: "Artigo ou comentário pai não encontrado" },
            "401": { description: "Não autenticado" },
          },
        },
      },
      "/comments/{id}": {
        delete: {
          tags: ["Comentários"],
          summary: "Remove o próprio comentário",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "ID do comentário",
            },
          ],
          responses: {
            "200": {
              description: "Comentário removido",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/RemovedResponse" },
                    },
                  },
                },
              },
            },
            "403": { description: "Tentativa de deletar comentário de outro usuário" },
            "404": { description: "Comentário não encontrado" },
            "401": { description: "Não autenticado" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
