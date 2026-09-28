import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FormEvent,
} from "react";
import { RaRecord, Identifier } from "react-admin";
import { useLocation } from "react-router-dom";
import { Box, Typography, TextField, Button } from "@mui/material";

// Define the shape of the context data
interface EmailContextData {
  imapServer: string;
  userEmail: string;
  emailList: RaRecord<Identifier>[];
  emailData: RaRecord<Identifier> | undefined;
}

// Create the EmailContext with initial values
const EmailContext = createContext<EmailContextData | undefined>(undefined);

// Create a custom hook to simplify accessing the EmailContext
export const useEmailContext = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error(
      "useEmailContext must be used within an EmailContextProvider"
    );
  }
  return context;
};

// Create the EmailContextProvider component
interface EmailContextProviderProps {
  children: ReactNode;
}

const PasswordForm = ({
  userEmail,
  login,
}: {
  userEmail: string;
  login: Function;
}) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    login(data.get("password"));
  };
  return (
    <Box
      p={2}
      display="flex"
      flexDirection="column"
      gap={2}
      alignItems="center"
      component="form"
      onSubmit={handleSubmit}
    >
      <Typography variant="h5">Login as {userEmail}</Typography>
      <TextField
        type="password"
        name="password"
        id="password"
        label="Password"
      />
      <Button type="submit">Submit</Button>
    </Box>
  );
};

export const EmailContextProvider: React.FC<EmailContextProviderProps> = ({
  children,
}) => {
  // Initial values
  const initialEmailContext: EmailContextData = {
    imapServer: "imap.springmicro.com",
    userEmail: "dbuckley@springmicro.com",
    emailList: [],
    emailData: undefined,
  };

  // State to store the email list
  const [emailList, setEmailList] = useState<RaRecord<Identifier>[]>(
    initialEmailContext.emailList
  );
  const [emailData, setEmailData] = useState<RaRecord<Identifier> | undefined>(
    undefined
  );
  const location = useLocation();
  const ws = React.useRef(
    new WebSocket(
      `ws://localhost:8123/email/${initialEmailContext.userEmail}/ws`
    )
  );

  ws.current.onmessage = function (event) {
    {
      const json = JSON.parse(event.data);
      if (json.status === "get_message_detail") {
        console.log(json.data);
        setEmailData(json.data);
        // messageDetail.innerHTML = json.data.html
      } else if (json.status === "get_message_list") {
        console.log(json.data);
        setEmailList(json.data);
        // emails.innerHTML = json.data.map((msg) => {{
        //     return `<li><button onclick="ws.send(${{msg.i}})">Open</button>${{msg.subject}} - ${{msg.date}}</li>`
        // }})
      } else {
        console.log(json.data);
        // btnSubmit.innerText = "Search"
        // input.setAttribute("type", "text")
        // var message = document.createElement('li')
        // var content = document.createTextNode(event.data)
        // message.appendChild(content)
        // messages.appendChild(message)
      }
    }
  };

  // Combine initial values with the dynamic emailList state
  const emailContextValue: EmailContextData = {
    ...initialEmailContext,
    emailList,
    emailData,
  };

  const login = (password: string) => {
    //console.log("login", password);
    ws.current.send(password);
  };

  React.useEffect(() => {
    console.log(location, "location");
    try {
      const params = new URLSearchParams(location.search);
      console.log(params);
      const detailEmailId = params.get("read");
      if (typeof detailEmailId === "string") {
        ws.current.send(parseInt(detailEmailId));
      } else {
        setEmailData(undefined);
      }
    } catch (e) {
      console.log(e);
      setEmailData(undefined);
    }
  }, [location]);

  if (emailList.length === 0) {
    // login
    return (
      <PasswordForm userEmail={initialEmailContext.userEmail} login={login} />
    );
  }

  return (
    <EmailContext.Provider value={emailContextValue}>
      {children}
    </EmailContext.Provider>
  );
};
