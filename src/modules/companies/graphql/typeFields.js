import { GraphQLBoolean, GraphQLID, GraphQLObjectType, GraphQLString } from "graphql";

export const companyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLID },
    companyName: { type: GraphQLString },
    industry: { type: GraphQLString },
    numberOfEmployees: { type: GraphQLString },
    companyEmail: { type: GraphQLString },
    approvedByAdmin: { type: GraphQLBoolean },
    bannedAt: { type: GraphQLString },
  }),
});
