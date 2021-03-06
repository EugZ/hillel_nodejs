function getParentElementWithClass(element, targetClassname) {
  const parent = element.parentElement;
  if (parent.classList.contains(targetClassname)) {
    return parent;
  }
  return getParentElementWithClass(parent, targetClassname);
}

class MessageHandler {
  messageTemplate = document.getElementById("template");
  messageList = document.querySelector(".messages");
  userName = document.getElementById("name");
  textarea = document.querySelector(".comment-field");
  submitBtn = document.querySelector(".submit");
  url = "http://localhost:3000/messages";

  submitNewMessage() {
    const data = this.getFormData();

    fetch(this.url, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(() => {
        return fetch(this.url);
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.renderMessages(data);
      })
      .catch(err => console.error(err));
  }
  getFormData() {
    const formData = {};
    formData.sender = this.userName.value;
    formData.text = this.textarea.value;
    formData.addedAt = new Date().toString();
    return formData;
  }
  updateMessage(messageData) {
    fetch(`${this.url}/${messageData._id}`, {
      method: "PUT",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(messageData),
    })
      .then(() => {
        return fetch(this.url);
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.renderMessages(data);
      })
      .catch(error => console.error(error));
  }
  fetchAllMessages() {
    const url = window.location.href;
    const queryParamsStr = url.split("?")[1];
    fetch(`http://localhost:3000/messages?${queryParamsStr}`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        this.renderMessages(data);
      })
      .catch(err => console.error(err));
  }
  retrieveDataFromMessage(message) {
    const messageId = message.querySelector("input[data-id]").value;
    const messageAuthor = message.querySelector("input[data-author]").value;
    const messageComment = message.querySelector("input[data-comment]").value;
    const messageDate = message.querySelector("input[data-date]").value;
    return {
      _id: messageId,
      sender: messageAuthor,
      text: messageComment,
      addedAt: messageDate,
    };
  }
  editMessage({ messageElem, data }) {
    const self = this;
    const commentField = messageElem.querySelector(".message__comment");
    const btnSection = messageElem.querySelector(".message__buttons");
    const textArea = document.createElement("textarea");
    const saveBtn = document.createElement("button");
    const isTextAreaAlreadyExist = messageElem.querySelector(
      ".message__textarea-edit",
    );
    if (isTextAreaAlreadyExist) {
      return;
    }

    textArea.classList.add("message__textarea-edit");
    textArea.value = data.text;

    saveBtn.textContent = "Save";
    saveBtn.classList.add("message__button", "button");
    saveBtn.addEventListener("click", onSave);

    messageElem.insertBefore(textArea, btnSection);
    btnSection.appendChild(saveBtn);

    function onSave(event) {
      const updatedData = { ...data };
      event.preventDefault();
      commentField.textContent = textArea.value;
      updatedData.text = commentField.textContent;
      self.updateMessage(updatedData);
      cleanUp();
    }
    function cleanUp() {
      saveBtn.removeEventListener("click", onSave);
      btnSection.removeChild(saveBtn);
      messageElem.removeChild(textArea);
    }
  }
  deleteMessage({ messageElem, data }) {
    messageElem.parentElement.removeChild(messageElem);
    fetch(`${this.url}/${data._id}`, {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch(error => console.error(error));
  }
  createMessage(data) {
    const { _id, sender, text, addedAt } = data;

    return `
      <li class="message">
        <input type="hidden" value="${_id}" data-id />
        <input type="hidden" value="${sender}" data-author />
        <input type="hidden" value="${text}" data-comment />
        <input type="hidden" value="${addedAt}" data-date />
        <p class="message__author">Username: ${sender}</p>
        <p class="message__comment">Comment: <br /> ${text}</p>
        <div class="message__buttons">
          <button class="message__edit message__button button">Edit</button>
          <button class="message__delete message__button button">Delete</button>
        </div>
      </li>
    `;
  }
  renderMessages(messageData) {
    this.messageList.innerHTML = "";

    if (this.messageList.children.length) {
      const messageIds = new Set();

      messageData.forEach(message => {
        messageIds.add(message._id);
      });

      let buffer = "";
      [...messageIds].forEach(uniqueId => {
        for (let listItem of this.messageList.children) {
          if (listItem.querySelector("input[data-id]").value !== uniqueId) {
            const data = messageData.find(msg => messageIds.has(msg._id));
            buffer += this.createMessage(data);
          }
        }
      });

      this.messageList.innerHTML += buffer;
      return;
    }

    messageData.forEach(data => {
      this.messageList.innerHTML += this.createMessage(data);
    });
  }
  initialize() {
    this.submitBtn.addEventListener("click", event => {
      event.preventDefault();
      this.submitNewMessage.call(this);
    });
    this.messageList.addEventListener("click", event => {
      const target = event.target;
      if (target.classList.contains("message__edit")) {
        const message = getParentElementWithClass(event.target, "message");
        const originalMessageData = this.retrieveDataFromMessage(message);

        this.editMessage({ messageElem: message, data: originalMessageData });
      }
      if (target.classList.contains("message__delete")) {
        const message = getParentElementWithClass(event.target, "message");
        const originalMessageData = this.retrieveDataFromMessage(message);
        this.deleteMessage({ messageElem: message, data: originalMessageData });
      }
    });
    this.fetchAllMessages();
  }
}

const messageHandler = new MessageHandler();
messageHandler.initialize();
