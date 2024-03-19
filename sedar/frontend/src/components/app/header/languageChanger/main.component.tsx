import React from 'react';
import { LanguageHelper } from '../../../../utils/helpers/languageHelper';
import { useTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TranslateIcon from '@material-ui/icons/Translate';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

/**
* Component for the language changer. 
*/
const LanguageChanger: React.FC = () => {
    const { t, i18n } = useTranslation()
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lang: string) => {
        return () => {
            LanguageHelper.changeLanguage(lang)
            handleClose()
        }
    };
      
    return (
        <React.Fragment>
            <Button
                aria-haspopup="true"
                color="inherit"
                startIcon={<TranslateIcon />}
                endIcon={<ExpandMoreIcon />}
                onClick={handleClick}
            >
                {t('languages.' + i18n.language.split('-')[0])}
            </Button>
            <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {LanguageHelper.supportedLanguages.map((lang) => <MenuItem key={lang} onClick={changeLanguage(lang)}>{t('languages.' + lang)}</MenuItem>)}
            </Menu>
        </React.Fragment>
    );
}

export default LanguageChanger