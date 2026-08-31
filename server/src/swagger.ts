export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Three-Way Match Engine API Documentation',
    version: '1.0.0',
    description: 'API services for PO, GRN, and Invoice parsing, Master SKU resolution, dynamic three-way matching, and summary status calculations.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive static Bearer token',
        security: [],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'mock-jwt-token-12345' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/documents/upload': {
      post: {
        summary: 'Upload document (PO, GRN, or Invoice) for extraction and matching',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'documentType'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  documentType: { type: 'string', enum: ['po', 'grn', 'invoice'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Document uploaded, extracted, resolved, and matched' },
        },
      },
    },
    '/documents': {
      get: {
        summary: 'List all stored documents',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['po', 'grn', 'invoice'] } },
          { name: 'poNumber', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of documents' },
        },
      },
    },
    '/documents/{id}': {
      get: {
        summary: 'Get single document details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Document details' } },
      },
    },
    '/documents/{id}/file': {
      get: {
        summary: 'Get original document raw file for preview',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Raw binary file stream' } },
      },
    },
    '/match/{poNumber}': {
      get: {
        summary: 'Compute dynamic Three-Way Match for PO',
        parameters: [{ name: 'poNumber', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Three-Way Match result including status, overall reasons, and item matches',
          },
        },
      },
    },
    '/summary/{poNumber}': {
      get: {
        summary: 'Get PO summary stats and associated document history table',
        parameters: [{ name: 'poNumber', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { description: 'Summary cards and document breakdown' },
      },
    },
    '/masters/sku': {
      get: {
        summary: 'List all SKU Master catalogue items',
        responses: { 200: { description: 'Array of SKU Master records' } },
      },
      post: {
        summary: 'Create a new SKU Master record',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['skuErpCode', 'name', 'agreedRate'],
                properties: {
                  skuErpCode: { type: 'string' },
                  name: { type: 'string' },
                  eanCode: { type: 'string' },
                  hsnCode: { type: 'string' },
                  uom: { type: 'string' },
                  agreedRate: { type: 'number' },
                  mrp: { type: 'number' },
                  priceTolerance: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/masters/sku/{id}': {
      get: { summary: 'Get single SKU Master' },
      patch: { summary: 'Update SKU Master' },
      delete: { summary: 'Delete SKU Master' },
    },
  },
};
