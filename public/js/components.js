const components = {
    searchItem: `<% for (let user of users) { %>
        <li>
            <img
                src="/images/default_user_image.jpg"
                alt="Profile Picture"
                class="profile-picture"/>
            <span><%= user.username %></span>    
        </li>
        <% } %>`,

    tags: `<div class="tags">
            <span><%= username %></span>
            <button><i class='fas fa-times'></i></button>
        </div>`,

    messageBlock: {
        sent: `<div class='sent-message-block'>
                <div>
                    <div class="chat-message-box">
                        <p><%= textContent %></p>
                    </div>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <span class="time-ellapsed">Just Now</span>
            </div>`,

        received: `<div class='received-message-block'>
                <div>
                    <img 
                        src="/images/default_user_image.jpg"
                        alt="Profile Picture"
                        class="profile-picture"
                    />
                    <div class="chat-message-box">
                        <p><%= textContent %></p>
                    </div>
                    <i class="fas fa-ellipsis-h"></i>
                </div>
                <span class="time-ellapsed">Just Now</span>
            </div>`,
    },

    chatHeader: `<div>
            <img
                src="/images/default_user_image.jpg"
                alt="Profile Picture"
                class="profile-picture"
            />
            <div>
                <span id="chat-receiver-username">
                <% for (let i = 0; i < usernames.length; i++) { %>
                <%= usernames[i] %>
                <% if (i < usernames.length - 1) { %>
                ,  
                <% } %>
                <% } %>
                </span>
            </div>
        </div>
        <div>
            <button class="btn-round">
                <i class="fas fa-paperclip"></i>
            </button>
            <button class="btn-round">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>`,

    chatDisplay: `<% for (let message of chat.messages) { %>
        <div class=<%= message.sender !== user.username ?
                'received-message-block': 'sent-message-block'%>>
            <div>
                <% if (message.sender !== user.username) { %>
                <img 
                    src="/images/default_user_image.jpg"
                    alt="Profile Picture"
                    class="profile-picture"
                />
                <% } %> 
                <div class="chat-message-box">
                    <p><%= message.textContent %></p>
                </div>
                <i class="fas fa-ellipsis-h"></i>
            </div>
            <span class="time-ellapsed"><%= message.timePassed  %> </span>
        </div>
        <% } %>`,
    chatMessages: `<% for (let message of messages) { %>
        <div class=<%= message.sender !== user.username ?
                'received-message-block': 'sent-message-block'%>>
            <% if (message.sender !== user.username) { %>
            <span class="sender-username"><%= message.sender %> </span>
            <% } %>
            <div>
                <% if (message.sender !== user.username) { %>
                <img 
                    src="/images/default_user_image.jpg"
                    alt="Profile Picture"
                    class="profile-picture"
                />
                <% } %> 
                <div class="chat-message-box">
                    <p><%= message.textContent %></p>
                </div>
                <i class="fas fa-ellipsis-h"></i>
            </div>
            <span class="time-ellapsed"><%= message.timePassed  %> </span>
        </div>
        <% } %>`,
};
