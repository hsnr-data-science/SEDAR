import React from "react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Grid, Typography} from "@material-ui/core";
import { Skeleton, CardHeader } from "@mui/material";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";
import MDEditor from "@uiw/react-md-editor";
import { LanguageHelper } from "../../../../utils/helpers/languageHelper";

/**
* Component that represents the wiki tab. This tab is only accessible for adminstrators. 
*/
const Wiki: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t, i18n} = useTranslation();

  const [editLoad, setEditLoad] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language.split('-')[0]);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("wiki.header")}
              </Typography>
              <Typography variant="subtitle1">
                {t("wiki.description")}
              </Typography><hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
          {
            viewModel.wiki==undefined?
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="250px"/>
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="text" />
                </Grid>
              </Grid>:
            <Box>
              {LanguageHelper.supportedLanguages.map((lang) => <Button disabled={selectedLanguage==lang} onClick={()=>{
                setEditLoad(true);
                viewModel.getWiki(lang).then(()=> {
                  setSelectedLanguage(lang)
                  setEditLoad(false)}).catch(error =>{
                  alert(error);
                  setEditLoad(false);});
              }}>{t('languages.' + lang)}</Button>)}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                  viewModel.putWiki(selectedLanguage).then(
                    ()=> setEditLoad(false)
                    ).catch(error =>{
                    alert(error);
                    setEditLoad(false);});
                }}
                >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <MDEditor
                      value={viewModel.wiki}
                      onChange={(v) => viewModel.wiki=v}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={editLoad}
                    >
                      {t("generic.save")}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
          }
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Wiki;
