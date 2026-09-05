let users = loadUsers();


/* =========================
   DATABASE
========================= */

function loadUsers() {

  try {

    return JSON.parse(
      localStorage.getItem("dynablox_users") || "[]"
    ).map(normalizeUser);

  } catch {

    return [];

  }

}


function saveUsers() {

  localStorage.setItem(
    "dynablox_users",
    JSON.stringify(users)
  );

}


function normalizeUser(user) {

  user.friends =
    Array.isArray(user.friends)
      ? user.friends
      : [];

  user.friendRequests =
    Array.isArray(user.friendRequests)
      ? user.friendRequests
      : [];

  user.followers =
    Array.isArray(user.followers)
      ? user.followers
      : [];

  user.following =
    Array.isArray(user.following)
      ? user.following
      : [];

  user.notifications =
    Array.isArray(user.notifications)
      ? user.notifications
      : [];

  user.owner = !!user.owner;
  user.moderator = !!user.moderator;
  user.verified = !!user.verified;

  user.banned = !!user.banned;
  user.expiredBanPending =
    !!user.expiredBanPending;

  user.banReason =
    user.banReason || "";

  user.banUnit =
    user.banUnit || "";

  if (user.banExpires === undefined) {
    user.banExpires = null;
  }

  return user;

}


/* =========================
   DEFAULT ACCOUNTS
========================= */

if (!users.some(u => u.username === "Boblox")) {

  users.push(
    normalizeUser({
      username: "Boblox",
      password: "owner",
      owner: true,
      verified: true
    })
  );

}


if (!users.some(u => u.username === "admin")) {

  users.push(
    normalizeUser({
      username: "admin",
      password: "admin123",
      moderator: true
    })
  );

}

users = users.map(normalizeUser);

saveUsers();


/* =========================
   USER HELPERS
========================= */

function getUser(username) {

  return users.find(
    user => user.username === username
  );

}


function getCurrentUser() {

  const username =
    localStorage.getItem("currentUser");

  if (!username) return null;

  return getUser(username);

}


/* =========================
   LOGIN
========================= */

function login() {

  const username =
    document
      .getElementById("loginUsername")
      ?.value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      ?.value;

  const error =
    document.getElementById("loginError");

  if (error) {
    error.textContent = "";
  }


  const user =
    getUser(username);


  if (!user || user.password !== password) {

    if (error) {
      error.textContent =
        "Invalid username or password.";
    }

    return;

  }


  if (
    user.banned ||
    user.expiredBanPending
  ) {

    sendToModeration(user);

    return;

  }


  localStorage.setItem(
    "currentUser",
    user.username
  );

  sessionStorage.removeItem(
    "reactivationUser"
  );

  window.location.href =
    "home.html";

}


/* =========================
   REGISTER
========================= */

function register() {

  const username =
    document
      .getElementById("registerUsername")
      ?.value
      .trim();

  const password =
    document
      .getElementById("registerPassword")
      ?.value;

  const error =
    document.getElementById("registerError");


  if (error) {
    error.textContent = "";
  }


  if (!username || !password) {

    if (error) {
      error.textContent =
        "Enter a username and password.";
    }

    return;

  }


  if (username.length < 3) {

    if (error) {
      error.textContent =
        "Username must be at least 3 characters.";
    }

    return;

  }


  if (
    users.some(
      user =>
        user.username.toLowerCase() ===
        username.toLowerCase()
    )
  ) {

    if (error) {
      error.textContent =
        "That username is already taken.";
    }

    return;

  }


  users.push(
    normalizeUser({
      username: username,
      password: password
    })
  );

  saveUsers();

  alert(
    "Account created! You can now log in."
  );

  showLogin();

}


/* =========================
   AUTH SWITCH
========================= */

function showRegister() {

  document
    .getElementById("loginForm")
    ?.classList
    .add("hidden");

  document
    .getElementById("registerForm")
    ?.classList
    .remove("hidden");

}


function showLogin() {

  document
    .getElementById("registerForm")
    ?.classList
    .add("hidden");

  document
    .getElementById("loginForm")
    ?.classList
    .remove("hidden");

}


/* =========================
   LOGOUT
========================= */

function logout() {

  localStorage.removeItem(
    "currentUser"
  );

  sessionStorage.removeItem(
    "reactivationUser"
  );

  window.location.href =
    "index.html";

}


/* =========================
   MODERATION
========================= */

function sendToModeration(user) {

  localStorage.removeItem(
    "currentUser"
  );

  sessionStorage.setItem(
    "reactivationUser",
    user.username
  );

  window.location.href =
    "moderation.html";

}


function getCurrentReactivationUser() {

  const username =
    sessionStorage.getItem(
      "reactivationUser"
    );

  if (!username) return null;

  return getUser(username);

}


function updateReactivateButton() {

  const checkbox =
    document.getElementById(
      "reactivateCheck"
    );

  const button =
    document.getElementById(
      "reactivateButton"
    );

  if (button) {

    button.disabled =
      !checkbox?.checked;

  }

}


function reactivateAccount() {

  const user =
    getCurrentReactivationUser();

  const checkbox =
    document.getElementById(
      "reactivateCheck"
    );


  if (
    !user ||
    !checkbox?.checked
  ) {
    return;
  }


  user.banned = false;
  user.expiredBanPending = false;

  user.banReason = "";
  user.banUnit = "";
  user.banExpires = null;

  saveUsers();

  sessionStorage.removeItem(
    "reactivationUser"
  );

  localStorage.setItem(
    "currentUser",
    user.username
  );

  window.location.href =
    "home.html";

}


/* =========================
   BAN DURATIONS
========================= */

function getBanDurationMs(
  value,
  unit
) {

  const number =
    Number(value);

  const units = {

    seconds: 1000,

    minutes:
      60 * 1000,

    hours:
      60 * 60 * 1000,

    days:
      24 * 60 * 60 * 1000,

    weeks:
      7 * 24 * 60 * 60 * 1000,

    months:
      30 * 24 * 60 * 60 * 1000

  };


  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    !units[unit]
  ) {
    return 0;
  }


  return number * units[unit];

}


/* =========================
   HOME
========================= */

function initHomePage() {

  const user =
    requireLogin();

  if (!user) return;


  const username =
    document.getElementById(
      "welcomeUsername"
    );

  const avatar =
    document.getElementById(
      "profileAvatar"
    );

  const verified =
    document.getElementById(
      "verifiedBadge"
    );


  if (username) {
    username.textContent =
      user.username;
  }


  if (avatar) {
    avatar.textContent =
      user.username
        .charAt(0)
        .toUpperCase();
  }


  if (verified) {

    verified.classList.toggle(
      "hidden",
      !user.verified
    );

  }

}


function searchGames() {

  const input =
    document.getElementById(
      "search"
    );

  if (!input) return;


  const search =
    input.value
      .toLowerCase()
      .trim();


  document
    .querySelectorAll(".game-card")
    .forEach(card => {

      card.style.display =
        card.textContent
          .toLowerCase()
          .includes(search)
          ? ""
          : "none";

    });

}


function playGame(name) {

  alert(
    "Launching " + name + "..."
  );

}


/* =========================
   FRIENDS
========================= */

function initFriendsPage() {

  const user =
    requireLogin();

  if (!user) return;

  renderFriends(user);

}


function getRelationship(
  current,
  target
) {

  if (
    current.friends.includes(
      target.username
    )
  ) {
    return "friend";
  }


  if (
    current.friendRequests.includes(
      target.username
    )
  ) {
    return "requested";
  }


  if (
    target.friendRequests.includes(
      current.username
    )
  ) {
    return "incoming";
  }


  return "none";

}


function renderFriends(current) {

  const container =
    document.getElementById(
      "friendsList"
    );

  if (!container) return;


  container.innerHTML = "";


  users
    .filter(
      user =>
        user.username !==
        current.username
    )
    .forEach(user => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "friend-card";


      const avatar =
        document.createElement(
          "div"
        );

      avatar.className =
        "avatar";

      avatar.textContent =
        user.username
          .charAt(0)
          .toUpperCase();


      const info =
        document.createElement(
          "div"
        );

      info.innerHTML = `
        <strong>
          ${escapeHTML(user.username)}
        </strong>

        ${
          user.verified
            ? '<span class="verified">✓</span>'
            : ""
        }
      `;


      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "friend-actions";


      const relationship =
        getRelationship(
          current,
          user
        );


      if (
        relationship === "friend"
      ) {

        actions.innerHTML =
          '<button class="small-button">Friends</button>';

      }

      else if (
        relationship === "requested"
      ) {

        actions.innerHTML =
          '<button class="small-button">Request sent</button>';

      }

      else if (
        relationship === "incoming"
      ) {

        actions.innerHTML = `

          <button
            class="small-button dark"
            onclick="acceptFriendRequest('${escapeJS(user.username)}')"
          >
            Accept
          </button>

          <button
            class="small-button"
            onclick="declineFriendRequest('${escapeJS(user.username)}')"
          >
            Decline
          </button>

        `;

      }

      else {

        actions.innerHTML = `

          <button
            class="small-button dark"
            onclick="sendFriendRequest('${escapeJS(user.username)}')"
          >
            Add Friend
          </button>

        `;

      }


      card.append(
        avatar,
        info,
        actions
      );

      container.appendChild(
        card
      );

    });

}


function sendFriendRequest(
  username
) {

  const current =
    getCurrentUser();

  const target =
    getUser(username);


  if (
    !current ||
    !target ||
    target.friendRequests.includes(
      current.username
    )
  ) {
    return;
  }


  target.friendRequests.push(
    current.username
  );


  target.notifications.unshift({

    text:
      current.username +
      " sent you a friend request.",

    time:
      Date.now()

  });


  saveUsers();

  renderFriends(current);

  updateNotificationCount();

}


function acceptFriendRequest(
  username
) {

  const current =
    getCurrentUser();

  const target =
    getUser(username);


  if (!current || !target) {
    return;
  }


  current.friendRequests =
    current.friendRequests.filter(
      name =>
        name !== username
    );


  if (
    !current.friends.includes(
      username
    )
  ) {

    current.friends.push(
      username
    );

  }


  if (
    !target.friends.includes(
      current.username
    )
  ) {

    target.friends.push(
      current.username
    );

  }


  target.notifications.unshift({

    text:
      current.username +
      " accepted your friend request.",

    time:
      Date.now()

  });


  saveUsers();

  renderFriends(current);

}


function declineFriendRequest(
  username
) {

  const current =
    getCurrentUser();

  if (!current) return;


  current.friendRequests =
    current.friendRequests.filter(
      name =>
        name !== username
    );


  saveUsers();

  renderFriends(current);

}


/* =========================
   NOTIFICATIONS
========================= */

function initNotificationsPage() {

  const user =
    requireLogin();

  if (!user) return;

  renderNotifications(user);

}


function renderNotifications(
  user
) {

  const container =
    document.getElementById(
      "notificationsList"
    );

  if (!container) return;


  if (
    !user.notifications.length
  ) {

    container.innerHTML =
      "<p>No notifications.</p>";

  }

  else {

    container.innerHTML =
      user.notifications
        .map(notification => `

          <div class="notification-card">

            <div>

              <strong>
                ${escapeHTML(
                  notification.text
                )}
              </strong>

              <div class="status">
                ${new Date(
                  notification.time ||
                  Date.now()
                ).toLocaleString()}
              </div>

            </div>

          </div>

        `)
        .join("");

  }


  user.notifications = [];

  saveUsers();

  updateNotificationCount();

}


function updateNotificationCount() {

  const badge =
    document.getElementById(
      "notificationCount"
    );

  const user =
    getCurrentUser();


  if (!badge) return;


  const count =
    user?.notifications?.length ||
    0;


  badge.textContent =
    count;


  badge.classList.toggle(
    "hidden",
    count === 0
  );

}


/* =========================
   ADMIN
========================= */

function initAdminPage() {

  const user =
    requireLogin();

  if (!user) return;


  if (
    !user.owner &&
    !user.moderator
  ) {

    window.location.href =
      "home.html";

    return;

  }


  renderAdmin();

}


function renderAdmin() {

  const container =
    document.getElementById(
      "adminUsers"
    );

  const search =
    document.getElementById(
      "adminSearch"
    );


  if (!container) return;


  const term =
    search?.value
      .toLowerCase()
      .trim() || "";


  const visibleUsers =
    users.filter(
      user =>
        user.username
          .toLowerCase()
          .includes(term)
    );


  container.innerHTML = "";


  visibleUsers.forEach(user => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "admin-user";


    let status =
      "Active";


    if (user.banned) {

      if (
        user.banExpires === null
      ) {

        status =
          "Permanently terminated";

      }

      else {

        status =
          "Suspended";

      }

    }

    else if (
      user.expiredBanPending
    ) {

      status =
        "Suspension ended";

    }


    row.innerHTML = `

      <div class="admin-user-info">

        <strong>
          ${escapeHTML(user.username)}
        </strong>

        ${
          user.owner
            ? '<span class="moderator-label">OWNER</span>'
            : ""
        }

        ${
          user.moderator
            ? '<span class="moderator-label">MODERATOR</span>'
            : ""
        }

        <div class="status">
          ${status}
        </div>

      </div>


      <div class="admin-actions">

        <button
          class="small-button danger"
          onclick="banUserPrompt('${escapeJS(user.username)}')"
        >
          Suspend
        </button>


        ${
          user.banned ||
          user.expiredBanPending

          ? `

            <button
              class="small-button dark"
              onclick="removeModeration('${escapeJS(user.username)}')"
            >
              Remove moderation
            </button>

          `

          : ""
        }


        ${
          getCurrentUser()?.owner

          ? `

            <button
              class="small-button"
              onclick="toggleModerator('${escapeJS(user.username)}')"
            >
              ${
                user.moderator
                  ? "Remove Mod"
                  : "Make Mod"
              }
            </button>

          `

          : ""
        }

      </div>

    `;


    container.appendChild(row);

  });

}


function banUserPrompt(
  username
) {

  const current =
    getCurrentUser();

  const target =
    getUser(username);


  if (
    !current ||
    (!current.owner &&
     !current.moderator) ||
    !target
  ) {
    return;
  }


  const reason =
    prompt(
      "Reason for suspension:"
    );


  if (reason === null) {
    return;
  }


  const duration =
    prompt(
      "Duration amount (leave blank for permanent):"
    );


  if (duration === null) {
    return;
  }


  if (!duration.trim()) {

    target.banned = true;

    target.expiredBanPending =
      false;

    target.banReason =
      reason;

    target.banUnit =
      "permanent";

    target.banExpires =
      null;

  }

  else {

    const unit =
      (
        prompt(
          "Unit: seconds, minutes, hours, days, weeks, or months",
          "days"
        ) || ""
      ).toLowerCase();


    const milliseconds =
      getBanDurationMs(
        duration,
        unit
      );


    if (!milliseconds) {

      alert(
        "Invalid duration or unit."
      );

      return;

    }


    target.banned = true;

    target.expiredBanPending =
      false;

    target.banReason =
      reason;

    target.banUnit =
      unit;

    target.banExpires =
      Date.now() +
      milliseconds;

  }


  saveUsers();

  renderAdmin();


  if (
    target.username ===
    current.username
  ) {

    sendToModeration(
      target
    );

  }

}


function removeModeration(
  username
) {

  const current =
    getCurrentUser();

  const target =
    getUser(username);


  if (
    !current ||
    !target ||
    (
      !current.owner &&
      !current.moderator
    )
  ) {
    return;
  }


  target.banned =
    false;

  target.expiredBanPending =
    false;

  target.banReason =
    "";

  target.banUnit =
    "";

  target.banExpires =
    null;


  saveUsers();

  renderAdmin();

}


function toggleModerator(
  username
) {

  const current =
    getCurrentUser();

  const target =
    getUser(username);


  if (
    !current?.owner ||
    !target
  ) {
    return;
  }


  target.moderator =
    !target.moderator;


  saveUsers();

  renderAdmin();

}


/* =========================
   PAGE SECURITY
========================= */

function requireLogin() {

  const user =
    getCurrentUser();


  if (!user) {

    window.location.href =
      "index.html";

    return null;

  }


  if (
    user.banned ||
    user.expiredBanPending
  ) {

    sendToModeration(
      user
    );

    return null;

  }


  setupNavigation();

  return user;

}


function setupNavigation() {

  const user =
    getCurrentUser();


  const adminButton =
    document.getElementById(
      "adminButton"
    );


  if (adminButton) {

    adminButton.classList.toggle(
      "hidden",
      !(
        user?.owner ||
        user?.moderator
      )
    );

  }


  const currentPage =
    document.body.dataset.page;


  document
    .querySelectorAll(
      "[data-page-link]"
    )
    .forEach(link => {

      link.classList.toggle(
        "active",
        link.dataset.pageLink ===
        currentPage
      );

    });


  updateNotificationCount();

}


/* =========================
   MODERATION PAGE
========================= */

function initModerationPage() {

  const user =
    getCurrentReactivationUser();


  if (!user) {

    window.location.href =
      "index.html";

    return;

  }


  /*
    Check if a temporary suspension
    has expired.
  */

  if (
    user.banned &&
    user.banExpires !== null &&
    Date.now() >=
      Number(user.banExpires)
  ) {

    user.banned =
      false;

    user.expiredBanPending =
      true;

    saveUsers();

  }


  const title =
    document.getElementById(
      "moderationTitle"
    );

  const subtitle =
    document.getElementById(
      "moderationSubtitle"
    );

  const reason =
    document.getElementById(
      "moderationReason"
    );

  const duration =
    document.getElementById(
      "moderationDuration"
    );

  const terms =
    document.getElementById(
      "moderationTerms"
    );

  const permanentText =
    document.getElementById(
      "permanentText"
    );

  const reactivateBox =
    document.getElementById(
      "reactivateBox"
    );


  permanentText.classList.add(
    "hidden"
  );

  reactivateBox.classList.add(
    "hidden"
  );


  /*
    PERMANENT TERMINATION
  */

  if (
    user.banned &&
    user.banExpires === null
  ) {

    title.textContent =
      "Account terminated";

    subtitle.textContent =
      "Your Dynablox account has been permanently terminated.";

    reason.textContent =
      "Reason: " +
      (
        user.banReason ||
        "No reason was provided."
      );

    duration.textContent =
      "Duration: Permanent";

    terms.textContent =
      "You cannot reactivate a permanently terminated account.";

    permanentText.classList.remove(
      "hidden"
    );

    return;

  }


  /*
    TEMPORARY SUSPENSION
  */

  if (user.banned) {

    title.textContent =
      "Account suspended";

    subtitle.textContent =
      "Your Dynablox account is temporarily suspended.";

    reason.textContent =
      "Reason: " +
      (
        user.banReason ||
        "No reason was provided."
      );


    const remaining =
      Math.max(
        0,
        Number(user.banExpires) -
        Date.now()
      );


    duration.textContent =
      "Time remaining: " +
      formatRemaining(
        remaining
      );


    terms.textContent =
      "You can return when the suspension ends.";

    return;

  }


  /*
    SUSPENSION EXPIRED
  */

  if (
    user.expiredBanPending
  ) {

    title.textContent =
      "Suspension ended";

    subtitle.textContent =
      "Your suspension has ended. Reactivate your account to continue.";

    reason.textContent =
      "Previous reason: " +
      (
        user.banReason ||
        "Your suspension has ended."
      );

    duration.textContent =
      "Duration: Ended";

    terms.textContent =
      "Tick the box below and press Reactivate Account.";

    reactivateBox.classList.remove(
      "hidden"
    );

    updateReactivateButton();

    return;

  }


  /*
    Nothing is wrong with account.
  */

  sessionStorage.removeItem(
    "reactivationUser"
  );

  localStorage.setItem(
    "currentUser",
    user.username
  );

  window.location.href =
    "home.html";

}


function formatRemaining(
  milliseconds
) {

  let seconds =
    Math.ceil(
      milliseconds / 1000
    );


  const days =
    Math.floor(
      seconds / 86400
    );

  seconds %= 86400;


  const hours =
    Math.floor(
      seconds / 3600
    );

  seconds %= 3600;


  const minutes =
    Math.floor(
      seconds / 60
    );

  seconds %= 60;


  const parts = [];


  if (days)
    parts.push(
      days + "d"
    );


  if (hours)
    parts.push(
      hours + "h"
    );


  if (minutes)
    parts.push(
      minutes + "m"
    );


  if (
    seconds ||
    !parts.length
  ) {

    parts.push(
      seconds + "s"
    );

  }


  return parts.join(" ");

}


/* =========================
   HELPERS
========================= */

function escapeHTML(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeJS(value) {

  return String(value)

    .replaceAll(
      "\\",
      "\\\\"
    )

    .replaceAll(
      "'",
      "\\'"
    );

}


/* =========================
   START PAGE
========================= */

function initPage() {

  const page =
    document.body.dataset.page;


  /*
    LOGIN PAGE
  */

  if (
    page === "index"
  ) {

    const username =
      localStorage.getItem(
        "currentUser"
      );


    if (username) {

      const user =
        getUser(username);


      if (user) {

        if (
          user.banned ||
          user.expiredBanPending
        ) {

          sendToModeration(
            user
          );

          return;

        }


        window.location.href =
          "home.html";

      }

    }

    return;

  }


  /*
    MODERATION PAGE
  */

  if (
    page === "moderation"
  ) {

    initModerationPage();

    return;

  }


  /*
    HOME
  */

  if (
    page === "home"
  ) {

    initHomePage();

    return;

  }


  /*
    FRIENDS
  */

  if (
    page === "friends"
  ) {

    initFriendsPage();

    return;

  }


  /*
    NOTIFICATIONS
  */

  if (
    page === "notifications"
  ) {

    initNotificationsPage();

    return;

  }


  /*
    ADMIN
  */

  if (
    page === "admin"
  ) {

    initAdminPage();

    return;

  }

}


document.addEventListener(
  "DOMContentLoaded",
  initPage
);
function getNextPlayerId() {
    const nextId = Number(
        localStorage.getItem("dynablox_nextPlayerId") || "1"
    );

    localStorage.setItem(
        "dynablox_nextPlayerId",
        String(nextId + 1)
    );

    return nextId;
}
