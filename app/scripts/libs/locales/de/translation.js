/*jshint quotmark: double,  maxlen: 1200 */

/**
 * Language-Files als RequireJS Module
 *
 * de
 */
define(function (require) {
    "use strict";

    // lade längere Texte als weiteres Modul, function (helpText) {
    var helpText = require("libs/locales/de/helptext");

    return {
        "error": "Es ist ein Fehler aufgetreten, das tut uns Leid. Check deine Internetverbindung und versuch\'s nochmal!",
        "validationError": "Fehler bei der Validierung. Vielleicht ist der Text zu lang?",
        "success": "Alles klar!",
        "serverError": "Etwas stimmt mit dem Server nicht, das tut uns Leid. Versuch's nochmal!",
        "browserNotSupported": "Sorry, dieser Browser wird noch nicht unterstützt.",
        "settings": "Einstellungen",
        "userSettings": "Benutzer",
        "langSettings": "Sprache",
        "notifySettings": "Benachrichtigungen",
        "notificationQuestion": "Welche Benutzer sollen benachrichtigt werden?",

        "notifyEmail": "Via E-Mail?",
        "notifyPush": "Via PUSH?",
        "notifyVibrate": "Vibrieren bei externen Änderungen?",

        "selectLang": "Wähle deine Sprache",
        "todolistTitle": "Titel der Liste",
        "todoDate": "Datum [optional]",
        "save": "Speichern",
        "saved": "Erfolgreich gespeichert",
        "cancel": "Abbrechen",
        "back": "Zurück",
        "about": "About",
        "startWithoutAccount":"Ohne Account",
        "signup": "Registrieren",
        "signupButton": "Registrieren",
        "signupTitle": "Neuen Account erstellen",
        "accountNotActivatedYet": "Dein Account wurde noch nicht aktiviert und läuft in __days__ ab. All deine Daten werden dann wieder gelöscht. Check deine E-Mails und klicke einfach auf den Link.",
        "signupSuccessMessage": "Registrierung erfolgreich! Wir haben Dir eine E-Mail mit einem Link zum Aktivieren deines Accounts gesendet.",
        "welcome_message_after_signup": "Hier siehst du Nachrichten bei externen Aktivitäten wie z.B. \"Du wurdest zu einer Liste eingeladen\", oder wenn ein anderer Benutzer eine Aufgabe in einer geteilten Liste ändert. Vergiss nicht, deinen Account zu aktivieren indem du auf den Link in der Willkommens-EMail klickst!",
        "created": "Erstellt",
        "updated": "Aktualisiert",
        "unknown": "Unbekannt",
        "yes": "Ja",
        "no": "Nein",
        "me": "Ich",
        "by": "von",
        "Confirm": "Bestätigen",
        "remove" : "entfernen",
        "removeAll" : "alle entfernen",
        "start": "Startscreen",
        "help": "Hilfe",
        "helpAndAbout": "Hilfe  & About",

        "really": "Bist du sicher?",
        "reallyLeave": "Wirklich verlassen? Es kann sein, dass ungespeicherte Daten verloren gehen.",
        "reallyAddUser": "Möchtest du den Benutzer mit der E-Mail Adresse `__email__` zu dieser Liste einladen? Wenn der Benutzer noch nicht existiert wird eine Einladungs-Email an diese Adresse gesendet.",
        "login": "Login",
        "logout": "Logout",
        "deleteAccount": "Account löschen",
        "deleteList": "Liste löschen",
        "shareList": "Liste teilen",
        "reallyDeleteAccount": "Wirklich löschen? All deine Daten werden ebenfalls gelöscht!",
        "successfullyDeleted": "Der Account wurde erfolgreich gelöscht.",
        "loginError": "Es ist ein Fehler beim Login aufgetreten, versuch es nochmal.",

        "all": "Alle",
        "active": "Aktiv",
        "completed": "Erledigt",
        "completedTodos": "Erledigte Aufgaben (__completed__)",

        "notLoggedIn": "Du bist nicht eingeloggt! <a href=\"#start\">Hier</a> geht's zur Startseite.",
        "helpText": helpText,

        "show": "Zeigen",
        "edit": "Bearbeiten",
        "editList": "Listen-Einstellungen",
        "delete": "Löschen",
        "close": "Schliessen",
        "notices": "Notizen...",

        "welcome": "Home-Spashscreen",
        "userDoesNotExist": "Benutzer existiert nicht!",
        "userDisplayName": "Beliebiger Name",
        "userDisplayEmail": "Email-Adresse",
        "noValidEMail": "Keine valide E-Mail Adresse!",
        "userEmailWasChanged": "Du hast deine E-Mail Adresse geändert. Du musst diese Adresse erneut bestätigen, indem du auf den Link in der gerade gesendeten Aktivierungsmail klickst.",
        "userDisplayPassword": "Passwort",
        "userDisplayPasswordAgain": "Passwort wiederholen",
        "passwordError": "Beide Passwörter müssen übereinstimmen und mindestens 6 Zeichen besitzen",
        "newList": "Neue Todoliste",
        "newTodo": "Neue Aufgabe",

        "userItems": "Du hast __count__ Todoliste.",
        "userItems_plural": "Du hast __count__ Todolisten.",
        "todosOfList": "Todos in Liste __title__",

        "allowedUsers": "Berechtigte Personen",
        "owner": "Eigentümer",
        "whoWorksWithThisList": "Mit welchen Personen möchtest du diese Liste teilen?",
        "searchForUsers": "Einladen via E-Mail Adresse...",
        "addUserToList": "__name__ einladen",

        "ClearCompleted": "Lösche Erledigte",
        "items": "__count__ Todo",
        "items_plural": "__count__ Todos",

        "noInternetConnection": "Das hat nicht geklappt. Bist du mit dem Internet verbunden?",

        "termsAcceptText": "Wenn du auf „Registrieren“ klickst, akzeptierst du unsere <a target=\"_blank\" href=\"http://at-one-go.com/terms?lang=de\">Nutzungsbedingungen</a>.",

        "recoverPasswort": "Passwort vergessen",

        "from": "Von",
        "list": "Liste",
        "lists": "Todolisten",
        "activities": "Ereignisse",
        "no_activities": "Keine Aktivitäten",
        "invitations": "__count__ Einladung",
        "invitations_plural": "__count__ Einladungen",
        "inviteSuccess": "Einladung erfolgreich. Der Benutzer muss diese jedoch noch bestätigen.",
        "inviteError": "Das hat nicht geklappt - Vielleicht hast du diesen Benutzer bereits eingeladen?",
        "acceptInvitationQuestion": "Einladung zu dieser Liste annehmen?",
        "invitation": "Der Benutzer __username__ hat dich zur Liste __list__ eingeladen!",
        "newIns": "Du hast neue Einladungen zu Listen, welche du nun bestätigen oder ablehnen kannst.",
        "invitation_accepted": "Der Benutzer __username__ hat die Einladung zur Liste __list__ angenommen",
        "invitation_rejected": "Der Benutzer __username__ hat die Einladung zur Liste __list__ abgelehnt",
        "list_access_removed": "Der Benutzer __username__ hat deine Berechtigung an der Liste __list__ zu arbeiten entfent",

        "update_list":  "Die Liste __list__ wurde geändert.",
        "delete_list":  "Die Liste __list__ wurde gelöscht.",
        "create_todo":  "Die Aufgabe __todo__ in der Liste __list__ wurde erstellt.",
        "update_todo":  "Die Aufgabe __todo__ in der Liste __list__ wurde geändert.",
        "delete_todo":  "Die Aufgabe __todo__ in der Liste __list__ wurde gelöscht.",
        "delete_todos": "Die Aufgaben __str__ in der Liste __list__ wurden gelöscht.",

        "ioUpdate": "Sync-Update-Browser",

        "sameTitleNoSense"          : "Zweimal der selbe Titel ist nicht möglich",

        "listTitleError"            : "Der Titel ist entweder zu kurz oder zu lang (höchstens. 32 Zeichen)",
        "listTitleTooLong"          : "Der Titel der Liste ist zu lang",
        "todoTitleTooLong"          : "Der Titel ist zu lang",
        "usernameTooLong"           : "Der Name ist zu lang",
        "userExists"                : "Der Benutzer existiert bereits",

        "test": "hello __foo__"
    };
});
