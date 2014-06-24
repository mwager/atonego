/*jshint quotmark: double,  maxlen: 1200 */

/**
 * Language-Files als RequireJS Module
 *
 * en
 */
define(function (require) {
    "use strict";

    // lade längere Texte als weiteres Modul, function (helpText) {
    var helpText = require("libs/locales/en/helptext");

    return {
        "error": "Sorry, this is an error. Check your internet connection and try again!",
        "validationError": "Validation-Error. Maybe some text is too long?",
        "success": "Alright!",
        "serverError": "There's something wrong with the server. Try again!",
        "browserNotSupported": "Sorry, this browser is currently not supported.",
        "settings": "Settings",
        "userSettings": "User",
        "langSettings": "Language",
        "notifySettings":"Notifications",
        "notificationQuestion": "Which users should be notified?",

        "notifyEmail": "Via email?",
        "notifyPush": "Via PUSH?",
        "notifyVibrate": "Vibrate on any external changes?",

        "selectLang": "Choose your language",
        "todolistTitle": "Title of the list",
        "todoDate": "Date [optional]",
        "save": "Save",
        "saved": "Successfully saved",
        "cancel": "Cancel",
        "back": "Go back",
        "about": "About",
        "startWithoutAccount":"Without account",
        "signup": "Signup",
        "signupButton": "Signup",
        "signupTitle": "Create an account",
        "accountNotActivatedYet": "Your account has not been activated yet and will be deleted in __days__. Please check your emails and click on the link.",
        "signupSuccessMessage": "Registration successful! We sent you an email to activate your account.",
        "welcome_message_after_signup": "This is the activity stream. Here, you will see all kind of messages from outside, e.g. \"you are invited to a list\" or when another user changes a task in a shared list. Don\'t forget to activate your account by clicking on the link in the welcome email we sent you!",
        "created": "Created",
        "updated": "Updated",
        "unknown": "Unknown",
        "yes": "Yes",
        "no": "No",
        "me": "You",
        "by": "by",
        "Confirm": "Confirm",
        "remove" : "remove",
        "removeAll" : "remove all",
        "start": "Startscreen",
        "help": "Help",
        "helpAndAbout": "Help & About",

        "really": "Are you sure?",
        "reallyLeave": "Really leave? Maybe unsaved data will be lost.",
        "reallyAddUser": "Do you want to invite the user with the email address `__email__` to this list? If that user does not exist, we will send an invitation email.",
        "login": "Login",
        "logout": "Logout",
        "deleteAccount": "Delete my account",
        "deleteList": "Delete list",
        "shareList": "Share list",
        "reallyDeleteAccount": "Really delete? All your data will be gone!",
        "successfullyDeleted": "Account deleted successfully. ",
        "loginError": "Oops, there was an error while trying to log you in, try again!",

        "all": "All",
        "active": "Active",
        "completed": "Completed",
        "completedTodos": "Completed tasks (__completed__)",

        "notLoggedIn": "You're not logged in! Go to the <a href=\"#start\">login page</a>.",
        "helpText": helpText,

        "show": "Show",
        "edit": "Edit",
        "editList": "List settings",
        "delete": "Delete",
        "close": "Close",
        "notices": "Notes...",

        "welcome": "Home-Spashscreen",
        "userDoesNotExist": "User does not exist!",
        "userDisplayName": "Your name",
        "userDisplayEmail": "Email address",
        "noValidEMail": "No valid email address!",
        "userEmailWasChanged": "You changed your email address. Please verify that this is your email address by clicking on the link in the activation email which we just sent to you.",
        "userDisplayPassword": "Password",
        "userDisplayPasswordAgain": "Password (again)",
        "passwordError": "Both passwords must be identical and have at least 6 characters",
        "newList": "Create todolist",
        "newTodo": "Create task",

        "userItems": "You have __count__  todolist.",
        "userItems_plural": "You have __count__  todolists.",
        "todosOfList": "Todos of list __title__",

        "allowedUsers": "Assigned users",
        "owner": "owner",
        "whoWorksWithThisList": "Who can work with this list?",
        "searchForUsers": "invite via email address...",
        "addUserToList": "Invite __name__",

        "ClearCompleted": "Clear completed",
        "items": "__count__ todo",
        "items_plural": "__count__ todos",

        "noInternetConnection": "You're not connected to the internet!",

        "termsAcceptText": "By signing up you agree to the <a target=\"_blank\" href=\"http://at-one-go.com/terms\">Terms of Use</a>.",

        "recoverPasswort": "Recover password",

        "from": "From",
        "list": "List",
        "lists": "Todolists",
        "activities": "Events",
        "no_activities": "No activities",
        "invitations": "__count__ invitation",
        "invitations_plural": "__count__ invitations",
        "inviteSuccess": "Invitation successfull. The other user now has to accept it.",
        "inviteError": "Error - Maybe you already invited this user?",
        "acceptInvitationQuestion": "Accept the invitation to this list?",
        "invitation":          "__username__ has invited you to the list __list__",
        "newIns": "You have new invitations to lists, which you can accept or decline.",
        "invitation_accepted": "__username__ has accepted your invitation to the list __list__",
        "invitation_rejected": "__username__ has rejected your invitation to the list __list__",
        "list_access_removed": "__username__ has removed your access to the list __list__",

        "update_list":  "The list __list__ was updated.",
        "delete_list":  "The list __list__ was deleted.",
        "create_todo":  "The task __todo__ in the list __list__ was created.",
        "update_todo":  "The task __todo__ in the list __list__ was updated.",
        "delete_todo":  "The task __todo__ in the list __list__ was deleted.",
        "delete_todos": "The tasks __str__ in the list __list__ were deleted.",

        "ioUpdate": "Sync-Update-Browser",

        "sameTitleNoSense"          : "Same title is not allowed",

        "listTitleError"            : "The title is either too short or too long (max. 32 characters)",
        "listTitleTooLong"          : "The title is too long",
        "todoTitleTooLong"          : "The title is too long",
        "usernameTooLong"           : "The name is too long",
        "userExists"                : "This user already exists",

        "test": "hello __foo__"
    };
});
