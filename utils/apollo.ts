import { ApolloClient, InMemoryCache } from "@apollo/client";

const ensSubGraphBaseURL =
  "https://api.thegraph.com/subgraphs/name/ensdomains/ens";
const client = new ApolloClient({
  // use subgraph as default uri
  uri: ensSubGraphBaseURL,
  cache: new InMemoryCache(),
});

export default client;
