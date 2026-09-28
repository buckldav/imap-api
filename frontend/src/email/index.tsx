import {
  useList,
  ListContextProvider,
  Datagrid,
  TextField,
  DateField,
} from "react-admin";
import { EmailContextProvider, useEmailContext } from "./context";
import { Interweave } from "interweave";

// const data = [
//   { id: 1, name: "Arnold" },
//   { id: 2, name: "Sylvester" },
//   { id: 3, name: "Jean-Claude" },
// ];

const EmailList = () => {
  const emailContext = useEmailContext();
  const listContext = useList({ data: emailContext.emailList });

  if (emailContext.emailData !== undefined) {
    return (
      <div>
        <a href="/#/emails">Back</a>
        <Interweave content={emailContext.emailData.html} />
      </div>
    );
  }

  return (
    <ListContextProvider value={listContext}>
      <Datagrid
        rowClick={(id: string, resource: string, record: any) =>
          `?read=${record.i}`
        }
      >
        <TextField source="id" />
        <DateField source="date" />
        <TextField source="from" />
        <TextField source="subject" />
      </Datagrid>
    </ListContextProvider>
  );
};

export const Email = () => {
  return (
    <EmailContextProvider>
      <EmailList />
    </EmailContextProvider>
  );
};
