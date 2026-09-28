## IMAP Client

```
HTTP (8123) -> Python App -> IMAP (993) -> Mailbox on Gmail's Servers
```

### Run using `uv`

Install `uv` if you don't have it. Great way to run Python programs.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Run

```bash
uv run uvicorn main:app --reload --port 8123
```

## How to connect your own Gmail Account using an App Password

https://www.systoolsgroup.com/how-to/create-gmail-app-password/
