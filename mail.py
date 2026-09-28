from imap_tools import MailBox, A

# Get date, subject and body len of all emails from INBOX folder
with MailBox("imap.gmail.com").login("email@example.com", "password") as mailbox:
    for msg in mailbox.fetch():
        print(msg.date, msg.subject, len(msg.text or msg.html))


from imap_tools import MailBox, A

# waiting for updates 60 sec, print unseen immediately if any update
with MailBox("imap.my.moon").login("acc", "pwd", "INBOX") as mailbox:
    responses = mailbox.idle.wait(timeout=60)
    if responses:
        for msg in mailbox.fetch(A(seen=False)):
            print(msg.date, msg.subject)
    else:
        print("no updates in 60 sec")
