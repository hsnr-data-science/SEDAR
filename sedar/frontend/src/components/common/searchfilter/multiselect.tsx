import * as React from 'react';
import useAutocomplete from '@material-ui/lab/useAutocomplete';
import Autocomplete, { AutocompleteGetTagProps } from '@material-ui/lab/Autocomplete'; // https://github.com/mui/material-ui/issues/24856
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import searchStore from '../../../stores/search.store';
import { ITag } from '../../../models/dataset';
import { observer } from 'mobx-react';

const Root = styled('div')(
  ({ theme }) => `
  color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'
    };
  font-size: 14px;
`,
);

const InputWrapper = styled('div')(
  ({ theme }) => `
  width: 100%;
  border: 1px solid ${theme.palette.mode === 'dark' ? '#434343' : '#d9d9d9'};
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  border-radius: 4px;
  padding: 1px;
  display: flex;
  flex-wrap: wrap;

  &:hover {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
  }

  &.focused {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  & input {
    background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
    color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'
    };
    height: 30px;
    box-sizing: border-box;
    padding: 4px 6px;
    width: 0;
    min-width: 30px;
    flex-grow: 1;
    border: 0;
    margin: 0;
    outline: 0;
  }
`,
);

interface TagProps extends ReturnType<AutocompleteGetTagProps> {
  label: string;
  id: string;
}

function Tag(props: TagProps) {
  const { label, id, ...other  } = props;
  return (
    <div {...other}>
      <span>{label}</span>
      <CloseIcon onClick={() => {
        if (searchStore.selectLinked == true) {
          let links = searchStore?.tags.find((t) => t.id == id).links
          searchStore?.selectedTags?.replace(searchStore?.selectedTags?.filter((t) => t.id != id && links.indexOf(t.id) == -1));
        } else {
          searchStore?.selectedTags?.replace(searchStore?.selectedTags?.filter((t) => t.id != id));
        }
        searchStore?.getDatasets();
      }} />
    </div>
  );
}

const StyledTag = styled(Tag)<TagProps>(
  ({ theme }) => `
  display: flex;
  align-items: center;
  height: 24px;
  margin: 2px;
  line-height: 22px;
  background-color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'
    };
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 4px 0 10px;
  outline: 0;
  overflow: hidden;

  &:focus {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
  }

  & span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  & svg {
    font-size: 12px;
    cursor: pointer;
    padding: 4px;
  }
`,
);

const Listbox = styled('ul')(
  ({ theme }) => `
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
  background-color: ${theme.palette.mode === 'dark' ? '#141414' : '#fff'};
  overflow: auto;
  max-height: 200px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;

  & li {
    padding: 5px 12px;
    display: flex;

    & span {
      flex-grow: 1;
    }

    & svg {
      color: transparent;
    }
  }

  & li[aria-selected='true'] {
    background-color: ${theme.palette.mode === 'dark' ? '#2b2b2b' : '#fafafa'};
    font-weight: 600;

    & svg {
      color: #1890ff;
    }
  }

  & li[data-focus='true'] {
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
    cursor: pointer;

    & svg {
      color: currentColor;
    }
  }
`,
);

/**
* Component for selecting multiple tags. 
*/
const Multiselect = observer(() => {
  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    id: 'customized-hook-demo',
    multiple: true,
    options: searchStore?.tags,
    value: searchStore?.selectedTags,
    onChange: (e, v) => {
      searchStore.selectedTags.replace([])
      v.forEach((t) => {
        if (searchStore.selectedTags.find((tg) => tg.id == (t as ITag).id) == undefined) {
          searchStore.selectedTags.push((t as ITag))
        }
        if (searchStore.selectLinked == true) {
          (t as ITag).links.forEach((t) => {
            {
              if (searchStore.selectedTags.find((tg) => tg.id == t) == undefined) {
                searchStore.selectedTags.push(searchStore?.tags.find((tg) => tg.id == t))
              }
            }
          })
        }
      })
      searchStore.getDatasets();
    },
    getOptionLabel: (option) => option.title,
  });

  return (
    <Root>
      <div {...getRootProps()} style={{ width: "100%" }}>
        <InputWrapper ref={setAnchorEl} className={focused ? 'focused' : ''}>
          {value.map((option: ITag, index: number) => (
            <StyledTag id={option.id} label={option.title} {...getTagProps({ index })} />
          ))}
          <input disabled={searchStore?.isSemanticSearch == true || searchStore?.isSourceDataSearch == true} {...getInputProps()} />
        </InputWrapper>
      </div>
      {groupedOptions.length > 0 ? (
        <Listbox {...getListboxProps()}>
          {(groupedOptions).map((option, index) => (
            <li {...getOptionProps({ option, index })}>
              <span>{option.title + ' (' + option.annotation.ontology.title + ': ' + option.annotation.instance + ')'}</span>
              <CheckIcon fontSize="small" />
            </li>
          ))}
        </Listbox>
      ) : null}
    </Root>
  );
});

export default Multiselect;
