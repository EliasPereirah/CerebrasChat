let can_delete_history = false;
let max_chats_history = 50;
let model = 'llama3.1-70b';
let CEREBRAS_ENDPOINT = "https://api.cerebras.ai/v1/chat/completions";

let MY_CEREBRAS_API_KEY = localStorage.getItem("MY_CEREBRAS_API_KEY");


let settings = document.querySelector("#settings");
settings.onclick = () => {
    let conversations = document.querySelector(".conversations");
    conversations.style.display = 'block';
    let hasTopic = document.querySelector(".conversations .topic");
    if (!hasTopic) {
        let ele = document.createElement('div');
        ele.innerText = 'No history';
        ele.classList.add('no_history')
        conversations.append(ele)
        setTimeout(() => {
            ele.remove();
            conversations.style.display = 'none';
        }, 3000);
    }
}


let new_chat = document.querySelector("#new_chat");
new_chat.addEventListener('click', () => {
    newChat(); // start new chat
})

jsClose = document.querySelector(".jsClose");
jsClose.onclick = () => {
    document.querySelector('.conversations').style.display = 'none';
}


setTimeout(() => {
    let chatMessages = document.querySelector("#chat-messages");
    chatMessages.scroll(0, 9559999);
}, 1000);

showdown.setFlavor('github');
showdown.setOption('ghMentions', false); // se true @algo se torna em github.com/algo
showdown.setOption("openLinksInNewWindow", true);
var converter = new showdown.Converter();

let conversations = {
    'messages': []
};

function addConversation(role, content) {
    closeDialogs();
    let new_talk = {'role': role, 'content': content};
    conversations.messages.push(new_talk);
    //chat_textarea.focus();
    let cnt;
    let div = document.createElement('div');
    div.classList.add('message');
    if (role === 'user') {
        div.classList.add('user');
        cnt = content;
        div.innerText = cnt;

    } else {
        div.classList.add('bot');
        cnt = converter.makeHtml(content);
        div.innerHTML = cnt;

    }
    document.querySelector('#chat-messages').append(div);
    div.scrollIntoView();
    saveLocalHistory();
}


function saveLocalHistory() {
    localStorage.setItem(chat_id, JSON.stringify(conversations));
    loadOldChatTopics();
}

function getPreviousChatTopic() {
    let all_topics = [];
    // pega todos ids
    let ids = [];
    let total_chats = 0;
    for (let i = 0; i < localStorage.length; i++) {
        let id = localStorage.key(i);
        id = parseInt(id);
        if (!isNaN(id)) {
            // important to the correct order
            ids.push(id);
        }
    }
    ids.sort((a, b) => b - a);  // organiza em ordem descendente
    let all_keys = [];

    ids.forEach(key => {
        if (total_chats >= max_chats_history) {
            // If it has to many messages remove the old ones
            localStorage.removeItem(key.toString());
        } else {
            all_keys.push(key);
        }
        total_chats++;
    })

    all_keys.forEach(id => {
        try {
            let topic = JSON.parse(localStorage.getItem(id)).messages[0].content ?? '';
            if (topic) {
                all_topics.push({'topic': topic, 'id': id});
            }
        } catch (error) {
            console.log('Error parser to JSON: ' + error)
        }
    });
    return all_topics;
}

function removeChat(div, id) {
    if (can_delete_history) {
        localStorage.removeItem(id);
        let ele = document.createElement('div');
        let content = document.querySelector(".container");
        ele.classList.add('chat_deleted_msg');
        if (parseInt(id) === chat_id) {
            // current chat - so clean the screen
            let all_user_msg = document.querySelectorAll("#chat-messages .message.user");
            let all_bot_msg = document.querySelectorAll("#chat-messages .message.bot");
            if (all_user_msg) {
                all_user_msg.forEach(um => {
                    um.remove();
                })
            }
            if (all_bot_msg) {
                all_bot_msg.forEach(bm => {
                    bm.remove();
                })
            }
            ele.innerText = "Current chat deleted!";
            content.prepend(ele);
        } else {
            content.prepend(ele);
            ele.innerText = "Chat deleted!";
        }
        setTimeout(() => {
            ele.remove();
        }, 2000);
        div.remove();
    } else {
        //div.id will be id of chat (key de localStorage)
        // loadOldConversation(div.id); // update conversation
    }
}

/**
 * Starts a new chat without any context from past conversation
 **/
function newChat() {
    removeScreenConversation();
    conversations.messages = []; // clean old conversation
    chat_id = new Date().getTime(); // generate a new chat_id
}

function removeScreenConversation() {
    let chatMessages = document.querySelector("#chat-messages")
    //remove old message on screen
    chatMessages.querySelectorAll(".message.user").forEach(userMsg => {
        userMsg.remove();
    })
    chatMessages.querySelectorAll(".message.bot").forEach(botMsg => {
        botMsg.remove();
    })
}


function loadOldConversation(old_talk_id) {
    let past_talk = localStorage.getItem(old_talk_id); // grab the old conversation

    localStorage.removeItem(old_talk_id); // remove old conversation from localstorage
    chat_id = new Date().getTime(); // renew ID

    let btn_star_old_chat = document.querySelector("[data-id='" + old_talk_id + "']");
    btn_star_old_chat.setAttribute("data-id", chat_id);

    let chatMessages = document.querySelector("#chat-messages");
    if (past_talk) {
        let messages = JSON.parse(past_talk).messages;
        conversations.messages = messages;
        localStorage.setItem(chat_id.toString(), JSON.stringify(conversations));

        removeScreenConversation();
        messages.forEach(msg => {
            let div_talk = document.createElement('div');
            div_talk.classList.add('message');
            if (msg.role === 'user') {
                div_talk.classList.add('user');
                div_talk.innerText = msg.content;
            } else {
                div_talk.classList.add('bot');
                div_talk.innerHTML = converter.makeHtml(msg.content);
            }

            chatMessages.append(div_talk);

        });


    } else {
        createDialog('Conversation not found!', 10)
    }
    hljs.highlightAll();
    enableCopyForCode();

}


function loadOldChatTopics() {
    let all_topics = getPreviousChatTopic();
    let history = document.querySelector(".conversations .history");
    let to_remove = history.querySelectorAll(".topic");
    // remove to add again updating with the current chat
    to_remove.forEach(ele => {
        ele.remove();
    })
    for (let i = 0; i < all_topics.length; i++) {
        let prev = all_topics[i];
        //console.log(all_topics);
        let div = document.createElement('div');
        let divWrap = document.createElement('div');
        div.classList.add('topic');
        div.classList.add('truncate');
        if (can_delete_history) {
            div.classList.add('deletable')
        }
        div.textContent = prev.topic.substring(0, 50);

        div.setAttribute('data-id', prev.id)
        div.addEventListener('click', () => {
            let the_id = div.getAttribute('data-id');
            if (can_delete_history) {
                removeChat(div, the_id);
            } else {
                loadOldConversation(the_id)
            }
        })
        divWrap.append(div);
        history.append(divWrap);
    }
}

loadOldChatTopics();

function cerebrasChat() {
    let all_parts = [];
    let invalid_key = false;
    conversations.messages.forEach(part => {
        //let role = part.role === 'assistant' ? 'model' : part.role;
        all_parts.push({content: part.content, role: part.role});
    })



    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MY_CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
            model: model,
            stream: false,
            messages: all_parts,
          //  temperature: 0,
           // max_tokens: -1,
            //seed: 0,
            //top_p: 1
        })
    };

    fetch(CEREBRAS_ENDPOINT, requestOptions)
        .then(response => response.json())
        .then(data => {
            let response_cnt = data.choices?.[0]?.message.content ?? '';
            if (!response_cnt){
                    if(data.code === "wrong_api_key"){
                        invalid_key = true;
                    }else {
                        addWarning(data.message, false);
                    }

            }
            addConversation('assistant', response_cnt);
        })
        .catch(error => {
            console.log(error);
            addWarning("Error: "+error);
        })
        .finally(() => {
            toggleAnimation();
            enableChat();
            if (invalid_key) {
                localStorage.setItem('MY_CEREBRAS_API_KEY', ''); // clean api key
                setApiKeyDialog();
            }
            hljs.highlightAll();
            enableCopyForCode();
        })
}




let chatButton = document.querySelector(".chat-input button");
let chat_textarea = document.querySelector(".chat-input textarea");

function startChat() {
    let input_text = chat_textarea.value;
    if (input_text.trim().length > 0) {
        toggleAnimation();
        chat_textarea.value = '';
        disableChat()
        addConversation('user', input_text);
        cerebrasChat();
    }
}

chatButton.onclick = () => {
    startChat();
}


function addWarning(msg, self_remove = true) {
    let divMother = document.createElement('div');
    divMother.classList.add('popup');
    let div = document.createElement('div');
    div.classList.add('warning');
    div.innerHTML = msg;
    document.querySelector(".container").append(divMother);
    if (self_remove) {
        setTimeout(() => {
            divMother.remove();
        }, 5000);
    } else {
        let close_warning = document.createElement('span');
        close_warning.classList.add('close_warning');
        div.append(close_warning);
        close_warning.onclick = (() => {
            divMother.remove();
        })
    }
    divMother.append(div);

}


function disableChat() {
    // chat_textarea.disabled = true;
}

function enableChat() {
    chat_textarea.disabled = false;
    // chat_textarea.focus();
}

function toggleAnimation() {
    let loading = document.querySelector("#loading")
    if (loading.style.display === 'inline-flex') {
        loading.style.display = 'none';
    } else {
        loading.style.display = 'inline-flex';
    }
}

chat_textarea.onkeyup = (event) => {
    if (event.key === 'Enter') {
        startChat();
    }
}

let can_delete = document.querySelector("#can_delete");
if (can_delete != null) {
    can_delete.addEventListener('change', (event) => {
        if (event.target.checked) {
            can_delete_history = true;
            let all_topics = document.querySelectorAll(".conversations .topic");
            all_topics.forEach(topic => {
                topic.classList.add('deletable');
            })
        } else {
            can_delete_history = false;
            let all_topics = document.querySelectorAll(".conversations .topic");
            all_topics.forEach(topic => {
                topic.classList.remove('deletable');
            })
        }
    });
}

function closeDialogs() {
    let dialog_close = document.querySelectorAll(".dialog_close");
    if (dialog_close) {
        dialog_close.forEach(dc => {
            if (dc.classList.contains('can_delete')) {
                dc.click();
            }
        })
    }

}


function enableCopyForCode() {
    document.querySelectorAll('code.hljs').forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerText = 'Copy';
        block.appendChild(button);
        button.addEventListener('click', () => {
            const codeText = block.innerText.replace('Copy', '');
            navigator.clipboard.writeText(codeText)
                .then(() => {
                    button.innerText = 'Copied!';
                    setTimeout(() => button.innerText = 'Copy', 2000);
                })
                .catch(err => console.error('Error:', err));
        });
    });
}


/**
 * add a message on the screen
 * - text: text to be added
 * - duration_seconds: optional - total duration in seconds
 * - add_class_name: optional - add a personalized class to add new style to dialog
 * - can_delete - If the user will be able to remove the dialog
 **/
function createDialog(text, duration_seconds = 0, add_class_name = '', can_delete = true) {
    let all_dialogs = document.getElementById("all_dialogs");
    let dialog_close = document.createElement('span');
    dialog_close.classList.add('dialog_close');
    let dialog = document.createElement('div');
    dialog.classList.add('dialog');
    if (add_class_name) {
        dialog.classList.add(add_class_name);
    }
    dialog.innerHTML = text;
    dialog.append(dialog_close);
    dialog.style.display = 'block';
    all_dialogs.append(dialog);
    if (can_delete) {
        dialog_close.classList.add('can_delete');
    }
    dialog_close.onclick = () => {
        dialog.remove();
    }

    if (duration_seconds) {
        let ms = duration_seconds * 1000;
        setTimeout(() => {
            dialog.remove();
        }, ms)
    }


}

function setApiKey() {
    let set_api_key = document.querySelector('#set_api_key');
    if (set_api_key) {
        let api_key = set_api_key.value.trim();
        if (api_key.length > 10) {
            MY_CEREBRAS_API_KEY = api_key;
            localStorage.setItem("MY_CEREBRAS_API_KEY", api_key);
            closeDialogs();
            createDialog('Save with success!', 5);
        }
    }
}

function setApiKeyDialog() {
    let cnt =
        `<div>Enter your Cerebras API key!</div>
         <input id="set_api_key" type="password" name="api_key" placeholder="Your API key">
         <button onclick="setApiKey()">Save</button>
         <div>If you don't have an API key yet, get it here 
         <a target="_blank" href="https://cloud.cerebras.ai/">https://cloud.cerebras.ai/</a>
         </div>`;
    createDialog(cnt, 0, 'setApiDialog');
}

if (!MY_CEREBRAS_API_KEY) {
    setApiKeyDialog();
}
