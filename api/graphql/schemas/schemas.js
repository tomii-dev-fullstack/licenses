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
    validateLicense(key: String!, productId: ID!): Boolean
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