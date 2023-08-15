import ContentStore from "./contentStore"

export default interface IViewProps<T = ContentStore> {
    viewModel: T
}