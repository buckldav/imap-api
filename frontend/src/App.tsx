import { Admin, Resource, ListGuesser, CustomRoutes } from "react-admin";
import { Route } from "react-router-dom";
import jsonServerProvider from "ra-data-json-server";
import { Email } from "./email";

const dataProvider = jsonServerProvider("https://jsonplaceholder.typicode.com");

const App = () => (
  <Admin dataProvider={dataProvider}>
    <CustomRoutes>
      <Route path="/emails" element={<Email />} />
    </CustomRoutes>
  </Admin>
);

export default App;
