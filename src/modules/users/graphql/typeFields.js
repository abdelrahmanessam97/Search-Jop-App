import { GraphQLID, GraphQLObjectType, GraphQLString } from "graphql";

export const userType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    role: { type: GraphQLString },
    bannedAt: { type: GraphQLString },
  }),
});
