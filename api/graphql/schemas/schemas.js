import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    getLicense(id: String!): licencia
    getLicenses: [licencia!]!
    getLicensesByProduct(productId: String!): [licencia!]!
  }

  type Mutation {
    generateLicense(productId: ID!): licencia
    createProduct(name: String!, webhookURL: String): Product
    revokeLicense(key: String!): licencia
    validateLicense(key: String!, productId: ID!): ValidationResponse
    logout: LogoutResponse
  }
  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  type ValidationResponse {
    success: Boolean!
    token: String
    message: String
  }
  type licencia {
    id: ID!
    key: String!
    status: String!
    user: String!
    usageCount: Int
    createdAt: String!
    expiresAt: String
  }

  type Product {
    id: ID!
    name: String!
    webhookURL: String
  }
`;