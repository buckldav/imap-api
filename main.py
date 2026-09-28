from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from imap_tools import MailBox, A
from imap_tools.utils import EmailAddress
import json
from pydantic import BaseModel, Field
from enum import Enum
from bs4 import BeautifulSoup, Doctype


def clean_up_html(html_string):
    # Parse the HTML string using BeautifulSoup
    soup = BeautifulSoup(html_string, "html.parser")

    # Remove DOCTYPE declaration
    for item in soup.contents:
        if isinstance(item, Doctype):
            item.extract()

    # Replace <html> tag with <div>
    if soup.html:
        soup.html.attrs = {}
        soup.html.name = "div"

    # Remove unwanted tags or attributes
    for script in soup(["script"]):
        script.decompose()  # Remove script tags

    # Get the cleaned HTML content
    cleaned_html = str(soup)

    return cleaned_html


IMAP = "imap.gmail.com"
EMAIL = "merit.apcs@gmail.com"

app = FastAPI()

html = f"""
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>The Worst Email Client Ever</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="password" id="messageText" autocomplete="off"/>
            <button id='btnSubmit'>Login</button>
        </form>
        <div id='messageDetail'>
        </div>
        <ul id='emails'>
        </ul>
        <ul id='messages'>
        </ul>
        <script>
            const emails = document.getElementById('emails')
            const messages = document.getElementById('messages')
            const messageDetail = document.getElementById('messageDetail')
            const btnSubmit = document.getElementById('btnSubmit')
            const input = document.getElementById("messageText")
            var ws = new WebSocket("ws://localhost:8123/email/{EMAIL}/ws");
            ws.onmessage = function(event) {{
                const json = JSON.parse(event.data)
                if (json.status === 'get_message_detail') {{
                    messageDetail.innerHTML = json.data.html
                }}
                else if (json.status === 'get_message_list') {{
                    emails.innerHTML = json.data.map((msg) => {{
                        return `<li><button onclick="ws.send(${{msg.i}})">Open</button>${{msg.subject}} - ${{msg.date}}</li>`
                    }})
                }} else {{
                    btnSubmit.innerText = "Search"
                    input.setAttribute("type", "text")
                    var message = document.createElement('li')
                    var content = document.createTextNode(event.data)
                    message.appendChild(content)
                    messages.appendChild(message)
                }}
            }};
            function sendMessage(event) {{
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }}
        </script>
    </body>
</html>
"""


class WsResponseStatus(Enum):
    LOGGING_IN = "logging_in"
    GET_MESSAGE_LIST = "get_message_list"
    GET_MESSAGE_DETAIL = "get_message_detail"
    ERROR_GET_MESSAGE_DETAIL = "error_get_message_detail"


class Store(BaseModel):
    password: str | None = Field(default=None)
    msgs: list = Field(default_factory=list)


class WsResponse(BaseModel):
    status: str
    data: dict | list | None = Field(default=None)


@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/email/{email}/ws")
async def websocket_endpoint(websocket: WebSocket, email: str):
    await websocket.accept()
    # in-memory store
    store = Store()
    while True:
        data = await websocket.receive_text()
        print(data)
        if store.password is None:
            store.password = data
            await websocket.send_text(
                WsResponse(status=WsResponseStatus.LOGGING_IN.value).model_dump_json()
            )
        elif data.isnumeric():
            # get message
            msg_index = int(data)
            if msg_index >= 0 and msg_index < len(msgs):
                msg = msgs[msg_index]
                await websocket.send_text(
                    WsResponse(
                        status=WsResponseStatus.GET_MESSAGE_DETAIL.value,
                        data={"html": clean_up_html(msg.html), "text": msg.text},
                    ).model_dump_json()
                )
            else:
                await websocket.send_text(
                    WsResponse(
                        status=WsResponseStatus.ERROR_GET_MESSAGE_DETAIL.value,
                        data={"detail": f"message index {msg_index} out of range."},
                    ).model_dump_json()
                )
            continue

        with MailBox(IMAP).login(email, store.password, "INBOX") as mailbox:
            msgs = []
            msgs_json = []
            i = 0
            for msg in mailbox.fetch(reverse=True, mark_seen=False):
                msgs.append(msg)
                sender = (
                    "Unknown Sender"
                    if msg.from_values is None
                    else msg.from_values.full
                )
                msgs_json.append(
                    {
                        "i": i,
                        "id": msg.uid,
                        "from": sender,
                        "date": msg.date.isoformat(),
                        "subject": msg.subject,
                    }
                )
                # print(msg.date, msg.subject)
                i += 1
                if i == 30:
                    # send the first 30
                    await websocket.send_text(
                        WsResponse(
                            status=WsResponseStatus.GET_MESSAGE_LIST.value,
                            data=msgs_json,
                        ).model_dump_json()
                    )
                    # TODO for now
                    break
            # send all once they've loaded
            await websocket.send_text(
                WsResponse(
                    status=WsResponseStatus.GET_MESSAGE_LIST.value, data=msgs_json
                ).model_dump_json()
            )
