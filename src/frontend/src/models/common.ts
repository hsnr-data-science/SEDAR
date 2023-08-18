export type IWithKey<T extends {}, KeyType = string> = T & {
    id: KeyType
}