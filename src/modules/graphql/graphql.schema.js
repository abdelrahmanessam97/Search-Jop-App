import { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLID, GraphQLBoolean } from "graphql";
import { userType } from "../users/graphql/typeFields.js";
import { companyType } from "../companies/graphql/typeFields.js";
import { companyModel, userModel } from "../../db/models/index.js";

// Fetch all users and companies in a single request.

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    allData: {
      type: new GraphQLObjectType({
        name: "AllData",
        fields: {
          users: { type: new GraphQLList(userType) },
          companies: { type: new GraphQLList(companyType) },
        },
      }),
      resolve: async () => {
        const users = await userModel.find();
        const companies = await companyModel.find();
        return { users, companies };
      },
    },
  },
});

// 2. Ban/unban a specific user.
// 3. Ban/unban a specific company.
// 4. Approve a company.

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    banUser: {
      type: userType,
      args: { id: { type: GraphQLID }, ban: { type: GraphQLBoolean } },
      resolve: async (_, { id, ban }) => {
        return userModel.findByIdAndUpdate(id, { bannedAt: ban ? new Date() : null }, { new: true });
      },
    },
    banCompany: {
      type: companyType,
      args: { id: { type: GraphQLID }, ban: { type: GraphQLBoolean } },
      resolve: async (_, { id, ban }) => {
        return companyModel.findByIdAndUpdate(id, { bannedAt: ban ? new Date() : null }, { new: true });
      },
    },
    approveCompany: {
      type: companyType,
      args: { id: { type: GraphQLID } },
      resolve: async (_, { id }) => {
        return companyModel.findByIdAndUpdate(id, { approvedByAdmin: true }, { new: true });
      },
    },
  },
});

export const schema = new GraphQLSchema({ query: RootQuery, mutation: Mutation });
