document.addEventListener("DOMContentLoaded", function() {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#email").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";

  // Sending an email
  document.querySelector("#email_submit").addEventListener("click", () => {
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: document.querySelector("#compose-recipients").value,
        subject: document.querySelector("#compose-subject").value,
        body: document.querySelector("#compose-body").value,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
      });
    event.preventDefault();
    load_mailbox("sent");
    return false;
  });
}

function load_email(email, mailbox) {
  // Hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  document.querySelector("#email").innerHTML = "";
  document.querySelector("#email").style.display = "block";

  fetch(`/emails/${email.id}`)
    .then((response) => response.json())
    .then((email) => {
      console.log(email);

      let element = document.createElement("div");
      element.setAttribute("class", "email");
      element.innerHTML = `
        <div>
          <p><small>BY: ${email.sender}</small></p>
          <p><small>TO: ${email.recipients}</small></p>
          <h4>Subject: ${email.subject}</h4>
          <p class="email_body">${email.body}</p>
          <p><small>Timestamp: ${email.timestamp}</small></p>
          <input type="submit" name="reply" value="Reply" id="reply" class="btn btn-sm btn-outline-primary">
        </div>
      `;

      element.querySelector("#reply").addEventListener("click", () => {
        reply(email, mailbox);
      });

      document.querySelector("#email").appendChild(element);
    });
  fetch(`/emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML =
    `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      console.log(emails);

      emails = emails.sort(function(a, b) {
        return b.id - a.id;
      });      

      emails.forEach((email) => {
        let element = document.createElement("div");
        element.setAttribute("class", "email_entry");
        element.innerHTML = `
        <span>
          <small>BY: ${email.sender}</small>
          <h4>${email.subject}</h4>
          <small>Timestamp: ${email.timestamp}</small>
          <input type="submit" name="archive" value="Archive" class="btn btn-sm btn-outline-primary" id="archive_button" style="display: none">
          <input type="submit" name="unarchive" value="Unarchive" class="btn btn-sm btn-outline-primary" id="unarchive_button" style="display: none">
        </span>
        `;
        element.style.color = "blue";
        element.style.border = "2px dotted darkgrey";
        element.style.borderCollapse = "collapse";
        element.style.cursor = "pointer";

        // Read colour change
        if (email.read == true) {
          element.style.backgroundColor = "grey";
          element.style.color = "black";
        } else {
          element.style.backgroundColor = "white";
        }

        element.addEventListener("click", () => {
          load_email(email, mailbox);
        });

        // Archive option
        if (mailbox == "inbox" && email.archived == false) {
          element
            .querySelector("#archive_button")
            .setAttribute("style", "display: block");
          element
            .querySelector("#archive_button")
            .addEventListener("click", () => {
              event.preventDefault();
              archive_email(email);
            });
        }
        if (mailbox == "archive" && email.archived == true) {
          element
            .querySelector("#unarchive_button")
            .setAttribute("style", "display: block");
          element
            .querySelector("#unarchive_button")
            .addEventListener("click", () => {
              event.preventDefault();
              unarchive_email(email);
            });
        }

        document.querySelector("#emails-view").appendChild(element);
      });
    });
}

function archive_email(email) {
  fetch(`/emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: true,
    }),
  }).then(() => {
    load_mailbox("inbox");
  });
}

function unarchive_email(email) {
  fetch(`/emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: false,
    }),
  }).then(() => {
    load_mailbox("inbox");
  });
}

function reply(email, mailbox) {
  compose_email();

  if (mailbox == "inbox"){
    document.querySelector("#compose-recipients").value = email.sender;
  }
  else if (mailbox == "sent") {
    document.querySelector("#compose-recipients").value = email.recipients;
  }
  
  if (email.subject.startsWith("Re: ")) {
    document.querySelector("#compose-subject").value = email.subject;
  }
  else {
    document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
  }
  document.querySelector("#compose-body").value = `\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;

}
