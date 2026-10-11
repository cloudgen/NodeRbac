// =============================================================================
// Menu language for the text menu.
// requirement-nodejs-cli-language — codes, the language leaf, and menu copy.
// requirement-nodejs-oop — class MenuLanguage.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

const _SHORT_KEY = {
  "language": "language_short",
  "system-log": "system_log_short",
  "self-management": "self_short",
  "exit": "exit_short",
  "back": "back_short"
};
const _LONG_KEY = {
  "hello": "hello_long",
  "language": "language_long",
  "system-log": "system_log_long",
  "self-management": "self_long",
  "exit": "exit_long",
  "back": "back_long",
  "view-log": "view_long",
  "clear-log": "clear_long",
  "log-folder": "folder_long",
  "version": "version_long",
  "about": "about_long",
  "version-check": "version_check_long",
  "self-update": "self_update_long",
  "self-uninstall": "self_uninstall_long",
  "self-install": "self_install_long"
};
const _LANG_TOKENS = {
  "english": "en",
  "en": "en",
  "English": "en",
  "simplified-chinese": "zh-Hans",
  "zh-hans": "zh-Hans",
  "zh-Hans": "zh-Hans",
  "简体中文": "zh-Hans",
  "traditional-chinese": "zh-Hant",
  "zh-hant": "zh-Hant",
  "zh-Hant": "zh-Hant",
  "繁體中文": "zh-Hant",
  "spanish": "es",
  "es": "es",
  "Español": "es",
  "español": "es",
  "arabic": "ar",
  "ar": "ar",
  "العربية": "ar",
  "عربي": "ar",
  "french": "fr",
  "fr": "fr",
  "Français": "fr",
  "français": "fr",
  "portuguese": "pt",
  "pt": "pt",
  "Português": "pt",
  "português": "pt",
  "portugues": "pt",
  "russian": "ru",
  "ru": "ru",
  "Русский": "ru",
  "русский": "ru",
  "german": "de",
  "de": "de",
  "Deutsch": "de",
  "deutsch": "de",
  "japanese": "ja",
  "ja": "ja",
  "日本語": "ja",
  "korean": "ko",
  "ko": "ko",
  "한국어": "ko",
  "dutch": "nl",
  "nl": "nl",
  "Nederlands": "nl",
  "nederlands": "nl",
  "greek": "el",
  "el": "el",
  "Ελληνικά": "el",
  "ελληνικά": "el"
};
const _FRONT_TOKENS = {
  "language": "language",
  "語言": "language",
  "语言": "language",
  "idioma": "language",
  "langue": "language",
  "Sprache": "language",
  "sprache": "language",
  "言語": "language",
  "언어": "language",
  "لغة": "language",
  "язык": "language",
  "taal": "language",
  "γλώσσα": "language",
  "system-log": "system-log",
  "系统日志": "system-log",
  "系統日誌": "system-log",
  "registro": "system-log",
  "journal": "system-log",
  "Systemprotokoll": "system-log",
  "システムログ": "system-log",
  "시스템 로그": "system-log",
  "registo": "system-log",
  "системный журнал": "system-log",
  "systeemlog": "system-log",
  "αρχείο καταγραφής": "system-log",
  "سجل النظام": "system-log",
  "session": "session",
  "access": "access",
  "setup": "setup",
  "audit": "audit",
  "serve": "serve",
  "self-management": "self-management",
  "自我管理": "self-management",
  "autogestión": "self-management",
  "autogestion": "self-management",
  "autogestão": "self-management",
  "Selbstverwaltung": "self-management",
  "selbstverwaltung": "self-management",
  "自己管理": "self-management",
  "자기관리": "self-management",
  "إدارة ذاتية": "self-management",
  "самоуправление": "self-management",
  "zelfbeheer": "self-management",
  "αυτοδιαχείριση": "self-management",
  "Exit": "exit",
  "离开": "exit",
  "離開": "exit",
  "Salir": "exit",
  "خروج": "exit",
  "Quitter": "exit",
  "Sair": "exit",
  "Выход": "exit",
  "Beenden": "exit",
  "終了": "exit",
  "종료": "exit",
  "Afsluiten": "exit",
  "Έξοδος": "exit"
};
const _TEXTS = {
  "en": {
    "path": "Path",
    "language_short": "language",
    "language_long": "display language for this menu",
    "system_log_short": "system-log",
    "system_log_long": "view, clear, and the log folder",
    "self_short": "self-management",
    "self_long": "version, about, and npm lifecycle",
    "exit_short": "Exit",
    "exit_long": "leave",
    "back_short": "Back",
    "back_long": "return to the main menu",
    "hello_long": "show a welcome message",
    "view_long": "list a log file and show it",
    "clear_long": "empty one log file",
    "folder_long": "show the log folder",
    "version_long": "show the installed version",
    "about_long": "version and this computer",
    "version_check_long": "compare this install with npm",
    "self_update_long": "upgrade this package with npm",
    "self_uninstall_long": "remove this package with npm",
    "self_install_long": "install this package with npm",
    "title_main": "main menu",
    "title_language": "language",
    "title_log": "system-log",
    "title_self": "self-management",
    "title_session": "session",
    "title_access": "access",
    "title_setup": "setup",
    "title_audit": "audit",
    "invalid": "That choice is not on this list. Pick a listed number.",
    "saved": "Menu language is English",
    "save_failed": "Could not save the menu language",
    "lang_long": "use {name} for this menu"
  },
  "zh-Hans": {
    "path": "路径",
    "language_short": "语言",
    "language_long": "此菜单的显示语言",
    "system_log_short": "系统日志",
    "system_log_long": "查看、清空，以及日志文件夹",
    "self_short": "自我管理",
    "self_long": "版本、关于，以及 npm 生命周期",
    "exit_short": "离开",
    "exit_long": "离开",
    "back_short": "返回",
    "back_long": "返回主菜单",
    "hello_long": "显示一条欢迎消息",
    "view_long": "列出日志文件并显示",
    "clear_long": "清空一个日志文件",
    "folder_long": "显示日志文件夹",
    "version_long": "显示已安装的版本",
    "about_long": "版本，以及这台计算机",
    "version_check_long": "用 npm 比较此安装",
    "self_update_long": "用 npm 升级此包",
    "self_uninstall_long": "用 npm 移除此包",
    "self_install_long": "用 npm 安装此包",
    "title_main": "主菜单",
    "title_language": "语言",
    "title_log": "系统日志",
    "title_self": "自我管理",
    "invalid": "这个选择不在列表上。请挑选列出的号码。",
    "saved": "菜单语言是简体中文",
    "save_failed": "无法保存菜单语言",
    "lang_long": "此菜单使用{name}"
  },
  "zh-Hant": {
    "path": "路徑",
    "language_short": "語言",
    "language_long": "這個選單的顯示語言",
    "system_log_short": "系統日誌",
    "system_log_long": "查看、清空，以及日誌資料夾",
    "self_short": "自我管理",
    "self_long": "版本、關於，以及 npm 生命週期",
    "exit_short": "離開",
    "exit_long": "離開",
    "back_short": "返回",
    "back_long": "返回主選單",
    "hello_long": "顯示一則歡迎訊息",
    "view_long": "列出日誌檔並顯示",
    "clear_long": "清空一個日誌檔",
    "folder_long": "顯示日誌資料夾",
    "version_long": "顯示已安裝的版本",
    "about_long": "版本，以及這台電腦",
    "version_check_long": "用 npm 比較此安裝",
    "self_update_long": "用 npm 升級此套件",
    "self_uninstall_long": "用 npm 移除此套件",
    "self_install_long": "用 npm 安裝此套件",
    "title_main": "主選單",
    "title_language": "語言",
    "title_log": "系統日誌",
    "title_self": "自我管理",
    "invalid": "這個選擇不在清單上。請挑選列出的號碼。",
    "saved": "選單語言是繁體中文",
    "save_failed": "無法儲存選單語言",
    "lang_long": "這個選單使用{name}"
  },
  "es": {
    "path": "Ruta",
    "language_short": "idioma",
    "language_long": "idioma de este menú",
    "system_log_short": "registro",
    "system_log_long": "ver, vaciar y la carpeta de registro",
    "self_short": "autogestión",
    "self_long": "versión, acerca de y el ciclo de npm",
    "exit_short": "Salir",
    "exit_long": "salir",
    "back_short": "Atrás",
    "back_long": "volver al menú principal",
    "hello_long": "muestra un mensaje de bienvenida",
    "view_long": "listar un archivo de registro y mostrarlo",
    "clear_long": "vaciar un archivo de registro",
    "folder_long": "mostrar la carpeta de registro",
    "version_long": "mostrar la versión instalada",
    "about_long": "versión y este equipo",
    "version_check_long": "comparar esta instalación con npm",
    "self_update_long": "actualizar este paquete con npm",
    "self_uninstall_long": "quitar este paquete con npm",
    "self_install_long": "instalar este paquete con npm",
    "title_main": "menú principal",
    "title_language": "idioma",
    "title_log": "registro",
    "title_self": "autogestión",
    "invalid": "Esa opción no está en la lista. Elija un número de la lista.",
    "saved": "El idioma del menú es español",
    "save_failed": "No se pudo guardar el idioma del menú",
    "lang_long": "usar {name} en este menú"
  },
  "ar": {
    "path": "المسار",
    "language_short": "لغة",
    "language_long": "لغة العرض لهذه القائمة",
    "system_log_short": "سجل النظام",
    "system_log_long": "عرض ومسح ومجلد السجل",
    "self_short": "إدارة ذاتية",
    "self_long": "الإصدار وحول ودورة npm",
    "exit_short": "خروج",
    "exit_long": "خروج",
    "back_short": "رجوع",
    "back_long": "العودة إلى القائمة الرئيسية",
    "hello_long": "اعرض رسالة ترحيب",
    "view_long": "سرد ملف سجل وعرضه",
    "clear_long": "إفراغ ملف سجل واحد",
    "folder_long": "عرض مجلد السجل",
    "version_long": "عرض الإصدار المثبّت",
    "about_long": "الإصدار وهذا الجهاز",
    "version_check_long": "قارن هذا التثبيت مع npm",
    "self_update_long": "ترقية هذه الحزمة بـ npm",
    "self_uninstall_long": "إزالة هذه الحزمة بـ npm",
    "self_install_long": "تثبيت هذه الحزمة بـ npm",
    "title_main": "القائمة الرئيسية",
    "title_language": "لغة",
    "title_log": "سجل النظام",
    "title_self": "إدارة ذاتية",
    "invalid": "هذا الاختيار ليس في القائمة. اختر رقماً معروضاً.",
    "saved": "لغة القائمة هي العربية",
    "save_failed": "تعذر حفظ لغة القائمة",
    "lang_long": "استخدام {name} لهذه القائمة"
  },
  "fr": {
    "path": "Chemin",
    "language_short": "langue",
    "language_long": "langue d'affichage de ce menu",
    "system_log_short": "journal",
    "system_log_long": "voir, vider et le dossier du journal",
    "self_short": "autogestion",
    "self_long": "version, à propos et le cycle npm",
    "exit_short": "Quitter",
    "exit_long": "quitter",
    "back_short": "Retour",
    "back_long": "revenir au menu principal",
    "hello_long": "afficher un message de bienvenue",
    "view_long": "lister un fichier journal et l'afficher",
    "clear_long": "vider un fichier journal",
    "folder_long": "afficher le dossier du journal",
    "version_long": "afficher la version installée",
    "about_long": "version et cet ordinateur",
    "version_check_long": "comparer cette installation avec npm",
    "self_update_long": "mettre à jour ce paquet avec npm",
    "self_uninstall_long": "retirer ce paquet avec npm",
    "self_install_long": "installer ce paquet avec npm",
    "title_main": "menu principal",
    "title_language": "langue",
    "title_log": "journal",
    "title_self": "autogestion",
    "invalid": "Ce choix n'est pas dans la liste. Choisissez un numéro affiché.",
    "saved": "La langue du menu est le français",
    "save_failed": "Impossible d'enregistrer la langue du menu",
    "lang_long": "utiliser {name} pour ce menu"
  },
  "pt": {
    "path": "Caminho",
    "language_short": "idioma",
    "language_long": "idioma deste menu",
    "system_log_short": "registo",
    "system_log_long": "ver, esvaziar e a pasta de registo",
    "self_short": "autogestão",
    "self_long": "versão, acerca de e o ciclo do npm",
    "exit_short": "Sair",
    "exit_long": "sair",
    "back_short": "Voltar",
    "back_long": "voltar ao menu principal",
    "hello_long": "mostra uma mensagem de boas-vindas",
    "view_long": "listar um ficheiro de registo e mostrá-lo",
    "clear_long": "esvaziar um ficheiro de registo",
    "folder_long": "mostrar a pasta de registo",
    "version_long": "mostrar a versão instalada",
    "about_long": "versão e este computador",
    "version_check_long": "comparar esta instalação com o npm",
    "self_update_long": "atualizar este pacote com o npm",
    "self_uninstall_long": "remover este pacote com o npm",
    "self_install_long": "instalar este pacote com o npm",
    "title_main": "menu principal",
    "title_language": "idioma",
    "title_log": "registo",
    "title_self": "autogestão",
    "invalid": "Essa escolha não está na lista. Escolha um número da lista.",
    "saved": "O idioma do menu é português",
    "save_failed": "Não foi possível guardar o idioma do menu",
    "lang_long": "usar {name} neste menu"
  },
  "ru": {
    "path": "Путь",
    "language_short": "язык",
    "language_long": "язык этого меню",
    "system_log_short": "системный журнал",
    "system_log_long": "просмотр, очистка и папка журнала",
    "self_short": "самоуправление",
    "self_long": "версия, о программе и цикл npm",
    "exit_short": "Выход",
    "exit_long": "выход",
    "back_short": "Назад",
    "back_long": "вернуться в главное меню",
    "hello_long": "показать приветствие",
    "view_long": "показать список файлов журнала и открыть один",
    "clear_long": "очистить один файл журнала",
    "folder_long": "показать папку журнала",
    "version_long": "показать установленную версию",
    "about_long": "версия и этот компьютер",
    "version_check_long": "сравнить эту установку с npm",
    "self_update_long": "обновить этот пакет через npm",
    "self_uninstall_long": "удалить этот пакет через npm",
    "self_install_long": "установить этот пакет через npm",
    "title_main": "главное меню",
    "title_language": "язык",
    "title_log": "системный журнал",
    "title_self": "самоуправление",
    "invalid": "Этого пункта нет в списке. Выберите номер из списка.",
    "saved": "Язык меню — русский",
    "save_failed": "Не удалось сохранить язык меню",
    "lang_long": "использовать {name} для этого меню"
  },
  "de": {
    "path": "Pfad",
    "language_short": "Sprache",
    "language_long": "Anzeigesprache für dieses Menü",
    "system_log_short": "Systemprotokoll",
    "system_log_long": "ansehen, leeren und der Protokollordner",
    "self_short": "Selbstverwaltung",
    "self_long": "Version, Info und npm-Lebenszyklus",
    "exit_short": "Beenden",
    "exit_long": "beenden",
    "back_short": "Zurück",
    "back_long": "zurück zum Hauptmenü",
    "hello_long": "eine Willkommensnachricht anzeigen",
    "view_long": "eine Protokolldatei auflisten und anzeigen",
    "clear_long": "eine Protokolldatei leeren",
    "folder_long": "den Protokollordner anzeigen",
    "version_long": "die installierte Version anzeigen",
    "about_long": "Version und dieser Computer",
    "version_check_long": "diese Installation mit npm vergleichen",
    "self_update_long": "dieses Paket mit npm aktualisieren",
    "self_uninstall_long": "dieses Paket mit npm entfernen",
    "self_install_long": "dieses Paket mit npm installieren",
    "title_main": "Hauptmenü",
    "title_language": "Sprache",
    "title_log": "Systemprotokoll",
    "title_self": "Selbstverwaltung",
    "invalid": "Diese Wahl steht nicht auf der Liste. Wählen Sie eine angezeigte Nummer.",
    "saved": "Die Menüsprache ist Deutsch",
    "save_failed": "Die Menüsprache konnte nicht gespeichert werden",
    "lang_long": "{name} für dieses Menü verwenden"
  },
  "ja": {
    "path": "パス",
    "language_short": "言語",
    "language_long": "このメニューの表示言語",
    "system_log_short": "システムログ",
    "system_log_long": "表示、消去、ログフォルダ",
    "self_short": "自己管理",
    "self_long": "バージョン、概要、npm のライフサイクル",
    "exit_short": "終了",
    "exit_long": "終了",
    "back_short": "戻る",
    "back_long": "メインメニューに戻る",
    "hello_long": "歓迎のメッセージを表示する",
    "view_long": "ログファイルを一覧して表示する",
    "clear_long": "ログファイルを1つ空にする",
    "folder_long": "ログフォルダを表示する",
    "version_long": "インストール済みのバージョンを表示する",
    "about_long": "バージョンとこのコンピュータ",
    "version_check_long": "このインストールを npm と比較する",
    "self_update_long": "npm でこのパッケージを更新する",
    "self_uninstall_long": "npm でこのパッケージを削除する",
    "self_install_long": "npm でこのパッケージをインストールする",
    "title_main": "メインメニュー",
    "title_language": "言語",
    "title_log": "システムログ",
    "title_self": "自己管理",
    "invalid": "その選択は一覧にありません。表示された番号を選んでください。",
    "saved": "メニューの言語は日本語",
    "save_failed": "メニューの言語を保存できませんでした",
    "lang_long": "このメニューで{name}を使う"
  },
  "ko": {
    "path": "경로",
    "language_short": "언어",
    "language_long": "이 메뉴의 표시 언어",
    "system_log_short": "시스템 로그",
    "system_log_long": "보기, 비우기, 로그 폴더",
    "self_short": "자기관리",
    "self_long": "버전, 정보, npm 수명 주기",
    "exit_short": "종료",
    "exit_long": "종료",
    "back_short": "뒤로",
    "back_long": "주 메뉴로 돌아가기",
    "hello_long": "환영 메시지를 보여 줍니다",
    "view_long": "로그 파일을 나열하고 표시합니다",
    "clear_long": "로그 파일 하나를 비웁니다",
    "folder_long": "로그 폴더를 표시합니다",
    "version_long": "설치된 버전을 표시합니다",
    "about_long": "버전과 이 컴퓨터",
    "version_check_long": "이 설치를 npm과 비교합니다",
    "self_update_long": "npm으로 이 패키지를 업그레이드합니다",
    "self_uninstall_long": "npm으로 이 패키지를 제거합니다",
    "self_install_long": "npm으로 이 패키지를 설치합니다",
    "title_main": "주 메뉴",
    "title_language": "언어",
    "title_log": "시스템 로그",
    "title_self": "자기관리",
    "invalid": "그 선택은 목록에 없습니다. 표시된 번호를 고르세요.",
    "saved": "메뉴 언어는 한국어",
    "save_failed": "메뉴 언어를 저장하지 못했습니다",
    "lang_long": "이 메뉴에서 {name} 사용"
  },
  "nl": {
    "path": "Pad",
    "language_short": "taal",
    "language_long": "weergavetaal voor dit menu",
    "system_log_short": "systeemlog",
    "system_log_long": "bekijken, legen en de logmap",
    "self_short": "zelfbeheer",
    "self_long": "versie, info en de npm-levenscyclus",
    "exit_short": "Afsluiten",
    "exit_long": "afsluiten",
    "back_short": "Terug",
    "back_long": "terug naar het hoofdmenu",
    "hello_long": "toon een welkomstbericht",
    "view_long": "een logbestand tonen en weergeven",
    "clear_long": "één logbestand legen",
    "folder_long": "de logmap tonen",
    "version_long": "de geïnstalleerde versie tonen",
    "about_long": "versie en deze computer",
    "version_check_long": "deze installatie met npm vergelijken",
    "self_update_long": "dit pakket met npm bijwerken",
    "self_uninstall_long": "dit pakket met npm verwijderen",
    "self_install_long": "dit pakket met npm installeren",
    "title_main": "hoofdmenu",
    "title_language": "taal",
    "title_log": "systeemlog",
    "title_self": "zelfbeheer",
    "invalid": "Die keuze staat niet op de lijst. Kies een nummer van de lijst.",
    "saved": "De menutaal is Nederlands",
    "save_failed": "De menutaal kon niet worden opgeslagen",
    "lang_long": "{name} voor dit menu gebruiken"
  },
  "el": {
    "path": "Διαδρομή",
    "language_short": "γλώσσα",
    "language_long": "γλώσσα εμφάνισης για αυτό το μενού",
    "system_log_short": "αρχείο καταγραφής",
    "system_log_long": "προβολή, εκκαθάριση και ο φάκελος καταγραφής",
    "self_short": "αυτοδιαχείριση",
    "self_long": "έκδοση, σχετικά και ο κύκλος του npm",
    "exit_short": "Έξοδος",
    "exit_long": "έξοδος",
    "back_short": "Πίσω",
    "back_long": "επιστροφή στο κύριο μενού",
    "hello_long": "δείξε ένα μήνυμα καλωσορίσματος",
    "view_long": "λίστα αρχείων καταγραφής και εμφάνιση",
    "clear_long": "εκκένωση ενός αρχείου καταγραφής",
    "folder_long": "εμφάνιση του φακέλου καταγραφής",
    "version_long": "εμφάνιση της εγκατεστημένης έκδοσης",
    "about_long": "έκδοση και αυτός ο υπολογιστής",
    "version_check_long": "σύγκριση αυτής της εγκατάστασης με το npm",
    "self_update_long": "αναβάθμιση αυτού του πακέτου με το npm",
    "self_uninstall_long": "αφαίρεση αυτού του πακέτου με το npm",
    "self_install_long": "εγκατάσταση αυτού του πακέτου με το npm",
    "title_main": "κύριο μενού",
    "title_language": "γλώσσα",
    "title_log": "αρχείο καταγραφής",
    "title_self": "αυτοδιαχείριση",
    "invalid": "Αυτή η επιλογή δεν είναι στη λίστα. Διάλεξε έναν αριθμό της λίστας.",
    "saved": "Η γλώσσα του μενού είναι ελληνικά",
    "save_failed": "Δεν ήταν δυνατή η αποθήκευση της γλώσσας του μενού",
    "lang_long": "χρήση της {name} για αυτό το μενού"
  }
};

export class MenuLanguage {
  // The thirteen menu languages, the saved code, and the words the menu prints.
  // English is the default when the leaf is missing, empty, or not one of the
  // codes. LANG is not read. NODERBAC_LANG wins at startup and does not write
  // the leaf. A menu pick writes the leaf and updates this process.

  static CODES = [
    ["en", "English", 41],
    ["zh-Hans", "简体中文", 42],
    ["zh-Hant", "繁體中文", 43],
    ["es", "Español", 44],
    ["ar", "العربية", 45],
    ["fr", "Français", 46],
    ["pt", "Português", 47],
    ["ru", "Русский", 48],
    ["de", "Deutsch", 49],
    ["ja", "日本語", 50],
    ["ko", "한국어", 51],
    ["nl", "Nederlands", 52],
    ["el", "Ελληνικά", 53],
  ];
  static BLOCK_FIRST = 40;
  static BLOCK_LAST = 59;
  static APP_DIR = "NodeRbac";
  static LEAF_NAME = "language";

  constructor(logger = null, home = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "MenuLanguage" });
    }
    if (home == null) {
      home = process.env.HOME || "";
    }
    this.home = home;
    this._code = "en";
    this.load();
  }

  codes() {
    return this.constructor.CODES.map((row) => row[0]);
  }

  endonym(code) {
    for (const [item, name] of this.constructor.CODES) {
      if (item === code) return name;
    }
    return "";
  }

  number_for(code) {
    for (const [item, _name, number] of this.constructor.CODES) {
      if (item === code) return number;
    }
    return null;
  }

  code_for_number(number) {
    for (const [code, _name, item] of this.constructor.CODES) {
      if (item === number) return code;
    }
    return null;
  }

  leaf_path() {
    // The language leaf. Empty when this process has no home directory.
    if (!this.home) return "";
    return path.join(this.home, ".local", this.constructor.APP_DIR, this.constructor.LEAF_NAME);
  }

  code() {
    return this._code;
  }

  load() {
    // Pick the code for this process. Does not write the leaf.
    // NODERBAC_LANG wins when it is one of the thirteen codes. Otherwise the
    // first line of the leaf is used. A missing, empty, or other line is English.
    // An other line is not rewritten.
    const forced = process.env.NODERBAC_LANG || "";
    if (this.codes().includes(forced)) {
      this._code = forced;
      return;
    }
    this._code = this._read_leaf();
  }

  _read_leaf() {
    const leaf = this.leaf_path();
    if (!leaf) return "en";
    let text = "";
    try {
      if (!fs.existsSync(leaf) || !fs.statSync(leaf).isFile()) return "en";
      text = fs.readFileSync(leaf, "utf8");
    } catch {
      return "en";
    }
    const nl = text.indexOf("\n");
    let line = nl >= 0 ? text.slice(0, nl) : text;
    line = line.replaceAll("\r", "").trim();
    if (this.codes().includes(line)) return line;
    return "en";
  }

  save(code) {
    // Write one code and switch this process. A failed write keeps the old code.
    // The message is in the language that is current after a success, and in
    // the language that was current before a failed write.
    if (!this.codes().includes(code)) return this.text("save_failed");
    const leaf = this.leaf_path();
    if (!leaf) return this.text("save_failed");
    const previous = this._code;
    let descriptor = null;
    try {
      const folder = path.dirname(leaf);
      fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
      fs.chmodSync(folder, 0o700);
      descriptor = fs.openSync(
        leaf,
        fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC,
        0o600,
      );
      fs.writeSync(descriptor, Buffer.from(`${code}\n`, "utf8"));
      fs.closeSync(descriptor);
      descriptor = null;
      fs.chmodSync(leaf, 0o600);
    } catch {
      if (descriptor != null) {
        try { fs.closeSync(descriptor); } catch { /* close after a failed write */ }
      }
      this._code = previous;
      return this.text("save_failed");
    }
    this._code = code;
    return this.text("saved");
  }

  text(key) {
    const block = _TEXTS[this._code] || _TEXTS.en;
    let found = Object.prototype.hasOwnProperty.call(block, key) ? block[key] : undefined;
    if (found == null) found = Object.prototype.hasOwnProperty.call(_TEXTS.en, key) ? _TEXTS.en[key] : "";
    return found;
  }

  path_label() {
    // The path-line word for the selected code. The directory is not translated.
    return this.text("path");
  }

  lang_long(endonym) {
    return this.text("lang_long").replaceAll("{name}", endonym);
  }

  row_short(kind, english) {
    const key = _SHORT_KEY[kind];
    if (key == null) return english;
    return this.text(key);
  }

  row_long(kind, english) {
    const key = _LONG_KEY[kind];
    if (key == null) return english;
    return this.text(key);
  }

  token_kind(token, layer) {
    // A typed word that is not the row currently on screen.
    // The language board accepts the code tokens. The front board accepts
    // every category short. Leaf verbs stay the English token on the row.
    if (layer === "lang") {
      const code = Object.prototype.hasOwnProperty.call(_LANG_TOKENS, token) ? _LANG_TOKENS[token] : undefined;
      if (code != null) return `set-${code}`;
      return null;
    }
    if (layer === "front") {
      if (Object.prototype.hasOwnProperty.call(_FRONT_TOKENS, token)) return _FRONT_TOKENS[token];
      return null;
    }
    return null;
  }
}

