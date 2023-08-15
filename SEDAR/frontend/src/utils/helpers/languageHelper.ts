import i18n from 'i18next';

/**
* Helper function for the language processing.
*/
export abstract class LanguageHelper {
    public static readonly fallbackLanguage: string = 'en'
    public static readonly supportedLanguages: ReadonlyArray<string> = ['de', 'en']

    public static get defaultLanguage(): string {
        return navigator.languages.find(lang => LanguageHelper.supportedLanguages.indexOf(lang) > -1) ?? LanguageHelper.fallbackLanguage
    }

    public static changeLanguage(language: string) {
        if (language != null && LanguageHelper.supportedLanguages.indexOf(language) == -1) {
            console.error(`Language '${language}' is not supported.`)
            return
        }

        i18n.changeLanguage(language)
    }
}
